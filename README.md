## Daveo Radio

Just a litle page on the intrawebs where I can broadcast and chat with friends.

> **Note:** the password prompt is *not* authentication — it gates a modal and
> nothing else. The socket connection and the Icecast stream are both reachable
> without it. See "Auth" below before putting this anywhere public.

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

Set `BASE_PATH=/radio` and `TRUST_PROXY=1`, then point nginx at it. `proxy_pass`
deliberately has **no** trailing path, so the `/radio` prefix is passed through
intact — the app expects to see it.

```nginx
location = /radio { return 301 /radio/; }

location /radio/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;   # websockets
    proxy_set_header Connection "upgrade";
    proxy_set_header Host       $host;
    proxy_set_header X-Real-IP  $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Leave `BASE_PATH` empty to serve at a domain root instead; the client works out
where it's mounted at runtime, so the same build covers both.

#### Routes

| Route | Purpose |
|---|---|
| `/` | the page |
| `/health` | ok, room count, socket count |
| `/api/status` | now-playing + listeners, proxied from Icecast |
| `/api/lastfm` | sidebar data, proxied so the API key stays server-side |
| `/api/broadcast` | POST `{msg}` — sends to every room |
| `/other` | the modal's password check (not auth) |

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

#### Auth

There isn't any, despite appearances. `ROOM_PASSWORD` is checked client-side via
the modal's `data-remote` hook; passing it just closes the modal. `/api/broadcast`
is unauthenticated, the socket handshake is unauthenticated, and the Icecast
stream can be opened directly.

Doing this properly means a server-verified session that covers the socket
handshake and the stream, not only the page.

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
