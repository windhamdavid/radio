# Deploying daveo-radio

The app lives at **davidwindham.com/radio** — a long-running Node process that
Apache proxies to, same shape as `/chess` and `/ask`. It is *not* served from the
web docroot.

## The one thing that's different from chess

**This app has a build step.** Express serves `app/`, which is compiled from
`src/` by esbuild and is **gitignored** — it is not in the repo. So production
must build it, and building needs the devDependencies (esbuild, bootstrap,
handlebars). That means a full `npm install`, not `npm ci --omit=dev`.

Every deploy is therefore: **pull → install → build → restart.**

## First-time setup

1. **Check out the repo** on the server (e.g. `/var/www/radio`).

   The default branch tracks `master`. If you deployed the `modernize` branch,
   check that out instead.

2. **Build.**
   ```sh
   npm install          # full — the build needs the devDeps
   npm run build        # src/ -> app/
   ```

3. **Configure secrets.** All operational config (PORT, BASE_PATH, TRUST_PROXY,
   stream URLs) is set by the process manager below. The only secret is the
   Last.fm API key. Put it in a gitignored `.env` in the repo root:
   ```sh
   echo 'LASTFM_API_KEY=your-key-here' > .env
   ```
   Unset is fine too — the sidebar lists just stay empty and the app still runs.

4. **Start it — pick one process manager:**

   **pm2** (matches chess-io):
   ```sh
   pm2 start ecosystem.config.cjs
   pm2 logs radio --lines 5     # confirm  basePath":"/radio"
   pm2 save                     # remember across reboots
   pm2 startup                  # prints a sudo command to enable on boot
   ```

   **or systemd:**
   ```sh
   sudo cp deploy/radio.service.example /etc/systemd/system/radio.service
   # edit User/Group/WorkingDirectory in it first
   sudo systemctl daemon-reload
   sudo systemctl enable --now radio
   ```

5. **Add the Apache proxy.** Paste the block from
   `deploy/apache-radio.conf.example` into the **existing** davidwindham.com
   vhost (both `:80` and `:443`) — not a new vhost. Check the Apache version
   first (`apachectl -v`); the file has Option A for 2.4.47+ and Option B for
   older. Then:
   ```sh
   apachectl configtest && sudo systemctl reload apache2   # or: apachectl -k graceful
   ```

6. **Verify:**
   ```sh
   curl -s https://davidwindham.com/radio/health           # {"ok":true,...}
   curl -s https://davidwindham.com/radio/api/status        # {"online":...}
   ```
   Then load `https://davidwindham.com/radio/` in a browser and confirm the
   chat connects (network tab: a `101 Switching Protocols` on
   `/radio/socket.io/…` means the websocket upgraded; HTTP 200 long-polls mean
   the Apache upgrade rule isn't matching).

## Redeploying new code

```sh
git pull && npm install && npm run build && pm2 restart radio
#                                            (or: sudo systemctl restart radio)
```

Optional, to slim `node_modules` after building — the devDeps are only needed
at build time, since their output is baked into `app/`:
```sh
npm prune --omit=dev     # run AFTER npm run build, never before
```

## Prerequisites on the server

- **Node 20+** (22.9+ if you use the `--env-file-if-exists` line in
  `ecosystem.config.cjs`; on older Node, put `LASTFM_API_KEY` in the pm2 env
  block or a systemd drop-in instead).
- **Apache** with `proxy proxy_http rewrite` (`proxy_wstunnel` too if you're on
  Option B).
- **Icecast** reachable at `stream.davidawindham.com` over **https** — the
  player and the `/api/status` proxy both need it, and http is blocked as mixed
  content on the TLS page.
- **Redis is NOT required.** Leave `REDIS_URL` unset and the app runs
  single-process, keeping chat state in memory. Only set it (and only then raise
  pm2 `instances`) if you ever need to scale to multiple processes.

## Notes

- **No auth, by design.** The page, the chat socket, and the Icecast stream are
  all reachable by anyone with the URL. This is a deliberate choice for a
  personal page — noted here so it's not a surprise.
- **`DAW_ORIGIN` must stay unset in production.** It's a local-dev-only shim that
  proxies `/embed` (the shared site chrome) to the main site when there's no
  Apache in front of node. In production Apache serves `/embed` from the docroot.
- The **Last.fm key** currently in git history (`e12ea1d0…`) is worth rotating —
  it's read-only public data and now server-side only, so low stakes, but the
  rotation is free.
