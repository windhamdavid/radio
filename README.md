## Daveo Radio

Just a litle page on the intrawebs where I can broadcast and chat with friends.

> **Note:** there is no authentication. The page, the chat socket and the Icecast
> stream are all reachable by anyone who has the URL. See "Auth" below before
> putting this anywhere public.

---
#### Built With:
- Icecast - https://icecast.org
- Node - https://nodejs.org
- Express - https://expressjs.com
- Socket.io - https://socket.io
- Redis - https://redis.io (optional)
- Amplitude.js - https://github.com/serversideup/amplitudejs
- Last.fm API - https://www.last.fm/api

---

#### Running it

Needs Node 20+.

```sh
npm install
cp .env.example .env     # then edit
npm run build            # src/ -> app/
npm start
```

`npm run dev` rebuilds on change and reloads the server.

Config is all environment variables (see `.env.example`) — there are no
`config.js` / `config-dev.js` files anymore.

Nothing renders until `npm run build` has run: Express serves `app/`, which is
generated from `src/` and is not in git.

#### Serving under davidawindham.com/radio

Set `BASE_PATH=/radio` and `TRUST_PROXY=1`, then proxy to it from Apache — the
same shape as the existing `/ask` proxy in the daw vhost:

```apache
# radio: proxy /radio to the node app (mirrors /ask)
ProxyPreserveHost On
ProxyPass        /radio http://127.0.0.1:3000/radio upgrade=websocket
ProxyPassReverse /radio http://127.0.0.1:3000/radio
```

Both sides keep the `/radio` prefix on purpose — the app is mounted at it and
expects to see it, and that keeps its own `/radio` → `/radio/` redirect correct
through `ProxyPassReverse`.

`upgrade=websocket` is what carries socket.io. It needs **Apache 2.4.47+**, where
`mod_proxy_http` handles protocol upgrades itself — `mod_proxy_wstunnel` is *not*
required (on older Apache it would be). Without the upgrade, socket.io still
works but silently falls back to HTTP long-polling.

ProxyPass is matched before the request is mapped to the filesystem, so
WordPress and its `.htaccess` never see `/radio`.

> **If `/radio` redirects you to `/online-radio`:** that's a **cached 301**. The
> WordPress page that used to live at `/radio` moved, and WP issues a permanent
> old-slug redirect, which browsers cache hard. Once the proxy is in place
> Apache answers `/radio` before WP ever sees it — but a browser that cached the
> 301 beforehand will keep redirecting itself. Hard-reload, or clear that entry.

Leave `BASE_PATH` empty to serve at a domain root instead; the client works out
where it's mounted at runtime, so the same build covers both.

#### Site chrome

The header and footer come from the main site's shared web components — the same
ones `/rtc` uses:

```html
<daw-header></daw-header>
<daw-footer></daw-footer>
<script src="/embed/chrome.js"></script>
```

`chrome.js` renders into a shadow root, so the site's styles stay sealed off from
this page's Bootstrap 3 and the two can't collide. Nothing is copied into this
repo — the chrome is maintained in the main site and can't drift out of sync here.

That script tag is root-relative on purpose: in production Apache serves `/embed`
from the docroot alongside `/radio`. Locally there's no Apache in front, so set
`DAW_ORIGIN=http://daw.stu` and the app proxies `/embed` to it. **Leave
`DAW_ORIGIN` unset in production.**

#### Routes

| Route | Purpose |
|---|---|
| `/` | the page |
| `/health` | ok, room count, socket count |
| `/api/status` | now-playing + listeners, proxied from Icecast |
| `/api/lastfm` | sidebar data, proxied so the API key stays server-side |
| `/api/broadcast` | POST `{msg}` — sends to every room |

All are relative to `BASE_PATH`.

#### Icecast

The player streams from `$STREAM_URL` and gets now-playing from `$STREAM_STATUS_URL`.

Both must be **https** — the page is served over TLS, so an `http://` stream is
blocked as mixed content.

Status is read from Icecast's stock `status-json.xsl` and proxied through
`/api/status` rather than being fetched from the browser. The old code called a
hand-customized `status2.xsl` over JSONP; Icecast upgrades overwrite those XSL
files (see the 2021 note below — it 404s today). The stock endpoint survives
upgrades, and proxying keeps the page same-origin.

#### Redis

Optional. Unset `REDIS_URL` and it runs single-process, keeping per-connection
state in memory. Set it and socket.io uses the Redis adapter so rooms and
presence work across multiple processes.

#### Chat

One room. The join/leave UI is gone and the server has no
`subscribe`/`unsubscribe` handlers, so the Lobby is the only room there is —
removing the buttons alone wouldn't have stopped anyone emitting `subscribe` by
hand.

Nicknames are opt-in: the person button beside the message box opens the nickname
dialog. Nothing is demanded on load; unnamed users chat as `anonymous`.

#### Auth

There isn't any, and there's no longer anything pretending otherwise — the old
password prompt was only ever a client-side modal gate, so it was removed rather
than left to imply protection it never gave.

`/api/broadcast` is unauthenticated, the socket handshake is unauthenticated, and
the Icecast stream can be opened directly. Doing this properly means a
server-verified session covering the socket handshake and the stream, not just
the page.

---

#### Notes:
- Feb 2016 - built and published @ http://radio.davidawindham.com
  - stream running from http://stream.davidawindham.com (8008)
- 2021 - Icecast updated overwrote Icecast XML files - see: https://davidawindham.com/til/docs/host/Icecast
- May 2022 - Migrate to new server, reinstall Icecast, add SSL to stream, updated packages, and secure Redis.
- Jul 2026 - Modernized. Server rewritten on Express 5 / socket.io 4; gulp (dead on
  Node 12+) replaced with esbuild; config moved to env vars; stream status proxied
  server-side over https; mountable under a subpath.
- Jul 2026 - Trimmed for the davidawindham.com/radio rebuild. Dropped the Facebook
  comments tab (third-party JS for a widget on the long-dead Graph v2.5) and the
  Call/Video tabs (WebRTC sample code with no signaling — it could only call
  itself). Last.fm moved behind a server-side proxy so the key no longer ships to
  the browser.
