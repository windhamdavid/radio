// pm2 process config for daveo-radio.
//
// CommonJS (.cjs) on purpose: package.json has "type": "module", so a plain
// ecosystem.config.js would be parsed as ESM and `module.exports` would throw.
// pm2 reads .cjs fine.
//
// IMPORTANT — build LOCALLY, upload the result. Unlike chess-io (which renders
// templates at runtime), this app serves the built bundle in app/, which is
// gitignored. Code is synced by FTP, so app/ only reaches the server if you
// build it first and include it in the upload. pm2 does NOT build.
//
// On the server (SSH), first time:
//     npm ci --omit=dev                   # 5 runtime deps only, no build tooling
//     pm2 start ecosystem.config.cjs
//     pm2 logs radio --lines 5            # confirm  basePath":"/radio"
//     pm2 save                            # remember across restarts
//     pm2 startup                         # prints a sudo command to enable on boot
//
// Redeploy: `npm run build` locally -> FTP up app/ + changed files ->
//     pm2 restart radio        (npm ci again only if package.json changed)
//
// Full runbook: deploy/README.md
//
module.exports = {
  apps: [
    {
      name: 'radio',
      script: 'app.js',
      cwd: __dirname,

      // Secrets / extra config come from a gitignored .env on the server
      // (LASTFM_API_KEY, and REDIS_URL if you enable it). Node reads it into
      // process.env; the inline env below still wins for anything set in both,
      // so the operational config here can't be overridden by a stale .env.
      // --env-file-if-exists needs Node 22.9+. On older Node, drop this line
      // and put LASTFM_API_KEY in the env block below instead.
      node_args: '--env-file-if-exists=.env',

      // Single process, fork mode -- NOT cluster. Per-connection chat state
      // (nicknames, presence) lives in memory in one process via socket.data;
      // multiple workers would each hold a different slice and socket.io would
      // need a shared adapter + sticky sessions. If you ever DO want to scale
      // out, set REDIS_URL (enables the socket.io Redis adapter) and raise
      // instances -- not before.
      instances: 1,
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        BASE_PATH: '/radio',
        TRUST_PROXY: 1,

        // Icecast. Must be https on a TLS page (mixed content is blocked).
        STREAM_URL: 'https://stream.davidawindham.com/stream',
        STREAM_STATUS_URL: 'https://stream.davidawindham.com/status-json.xsl',
        STREAM_MOUNT: '/stream',

        // LASTFM_API_KEY: set it in .env on the server (see node_args above).
        // Unset => the sidebar lists just stay empty; the app still runs.
        LASTFM_USER: 'windhamdavid',

        // DAW_ORIGIN is intentionally omitted -- it is a local-dev-only shim for
        // the shared chrome and must stay UNSET in production, where Apache
        // serves /embed from the WordPress docroot.
      },
    },
  ],
};
