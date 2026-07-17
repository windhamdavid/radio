# Deploying daveo-radio

The app lives at **davidwindham.com/radio** — a long-running Node process that
Apache proxies to, same shape as `/chess` and `/ask`. It is *not* served from the
web docroot.

Code is synced to the server by **FTP**, and the process is managed over SSH
(pm2 or systemd), same as the other node apps.

## Build locally — this is the part that bites

Express serves `app/`, which is compiled from `src/` by esbuild and is
**gitignored**. FTP uploads files from your disk, so:

> **Run `npm run build` locally before every upload, and make sure `app/` is
> included in what you FTP up.**

If you forget, the server keeps serving the *previous* `app/` (or none), and your
changes silently don't appear — no error, just stale files. `src/` and the build
tooling (esbuild, bootstrap, handlebars) never need to go to the server at all;
they only exist to produce `app/` on your machine.

## What the server actually needs

Only four things, at runtime:

| On the server | Where it comes from |
| --- | --- |
| `app/` | built locally, uploaded by FTP |
| `app.js` | uploaded by FTP |
| `package.json` (+ `package-lock.json`) | uploaded by FTP |
| `node_modules/` (prod only — 5 packages) | `npm ci --omit=dev` on the server |

Not needed on the server: `src/`, `build.mjs`, `esbuild`, `bootstrap`,
`handlebars`. Those are build-time only.

## First-time setup

1. **Build locally.**
   ```sh
   npm run build          # produces app/
   ```

2. **FTP up** the project folder, including `app/`. At minimum:
   `app/`, `app.js`, `package.json`, `package-lock.json`,
   `ecosystem.config.cjs`, `deploy/`. Skip `node_modules/`, `.env`, `src/`.

3. **Install runtime deps on the server** (SSH, once — and again only when
   `package.json` changes):
   ```sh
   cd /path/to/radio
   npm ci --omit=dev      # installs ONLY the 5 runtime deps, no build tooling
   ```
   *(No shell npm? Then also build `node_modules` locally with
   `npm ci --omit=dev` and FTP it up. Slower — thousands of files — but works.)*

4. **Set the secret** — a gitignored `.env` in the app root on the server:
   ```sh
   echo 'LASTFM_API_KEY=your-key-here' > .env
   ```
   Unset is fine — the sidebar lists just stay empty and the app still runs.

5. **Start it — pick one process manager:**

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

6. **Add the Apache proxy.** Paste the block from
   `deploy/apache-radio.conf.example` into the **existing** davidwindham.com
   vhost (both `:80` and `:443`) — not a new vhost. Check the Apache version
   first (`apachectl -v`); the file has Option A for 2.4.47+ and Option B for
   older. Then:
   ```sh
   apachectl configtest && sudo systemctl reload apache2   # or: apachectl -k graceful
   ```

7. **Verify:**
   ```sh
   curl -s https://davidwindham.com/radio/health            # {"ok":true,...}
   curl -s https://davidwindham.com/radio/api/status         # {"online":...}
   ```
   Then load `https://davidwindham.com/radio/` and confirm the chat connects
   (network tab: a `101 Switching Protocols` on `/radio/socket.io/…` means the
   websocket upgraded; HTTP-200 long-polls mean the Apache upgrade rule isn't
   matching).

## Redeploying new code

```sh
# locally
npm run build

# FTP: upload the changed files — and app/ whenever you rebuilt

# on the server (SSH)
pm2 restart radio          # or: sudo systemctl restart radio
```

Run `npm ci --omit=dev` on the server again **only** if `package.json` changed.
The node process serves the new `app/` the moment it restarts — but it must
restart; it won't pick up files live.

**FTP uploads but never deletes.** Files removed from the project (this cleanup
dropped `gulpfile.js`, the whole `webrtc-*` bundle, and vendored libs) will
linger on the server after a plain upload — harmless clutter, except inside
`app/`, where a stale bundle could actually be served. `npm run build` wipes
`app/` locally each time, so the safe move is to **delete the server's `app/`
before uploading the fresh one** (or use an FTP "mirror / delete orphans" mode
scoped to `app/`). For a first deploy there's nothing there yet, so it doesn't
matter.

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
