import { createServer } from 'node:http';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { Server } from 'socket.io';
import validator from 'validator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ***************************************************************************
// Config
// ***************************************************************************

// Everything comes from the environment. Use `.env` locally (see .env.example);
// `npm run dev` loads it. In production pass real env vars via the service
// manager. This replaces the old config.js / config-dev.js pair, which was
// gitignored and therefore never actually present.
const config = {
  port: Number(process.env.PORT ?? 3000),
  // '' when served at the domain root, '/radio' when mounted at a subpath.
  basePath: normalizeBasePath(process.env.BASE_PATH ?? ''),
  mainRoom: process.env.MAIN_ROOM ?? 'Lobby',
  // Unset => single process, no Redis. Set => Redis adapter, multi-process safe.
  redisUrl: process.env.REDIS_URL ?? '',
  // Number of reverse proxies in front of us, or a preset like 'loopback'.
  trustProxy: process.env.TRUST_PROXY ?? '',
  debug: process.env.DEBUG === 'true',
  // Icecast's own JSON status. The old code polled a hand-customized
  // status2.xsl over JSONP; Icecast upgrades overwrite those XSL files (it
  // 404s today, and has since 2021 per the README), so use the stock endpoint
  // and proxy it from here instead.
  streamStatusUrl:
    process.env.STREAM_STATUS_URL ?? 'https://stream.davidawindham.com/status-json.xsl',
  streamMount: process.env.STREAM_MOUNT ?? '/stream',
  // the-ham.org video (nginx-rtmp -> HLS). /api/live proxies its stat.xml
  // (which has no CORS, unlike the .m3u8/.ts) to discover the live stream and
  // report online/offline, so the client never hardcodes a stream key.
  hamStatUrl: process.env.HAM_STAT_URL ?? 'https://the-ham.org/stat.xml',
  hamHlsBase: process.env.HAM_HLS_BASE ?? 'https://the-ham.org/stream/hls/',
  hamApp: process.env.HAM_APP ?? 'live',
  // Proxied via /api/lastfm so the key stops shipping in the client bundle.
  // Unset => the sidebar lists just stay empty.
  lastfmKey: process.env.LASTFM_API_KEY ?? '',
  lastfmUser: process.env.LASTFM_USER ?? 'windhamdavid',
  // Local dev only. See the /embed proxy below.
  dawOrigin: process.env.DAW_ORIGIN ?? '',
};

function normalizeBasePath(value) {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

const MAX_MESSAGE_LENGTH = 500;
const MAX_ROOM_LENGTH = 25;

const logger = new EventEmitter();
logger.on('newEvent', (event, data) => {
  console.log('%s: %s', event, JSON.stringify(data));
});

// ***************************************************************************
// App
// ***************************************************************************

const app = express();
const server = createServer(app);

if (config.trustProxy) {
  // Needed for correct client IPs / protocol when nginx fronts us at /radio.
  const asNumber = Number(config.trustProxy);
  app.set('trust proxy', Number.isNaN(asNumber) ? config.trustProxy : asNumber);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const router = express.Router();

// Built assets. `npm run build` produces app/ from src/.
router.use(express.static(path.join(__dirname, 'app')));

router.get('/health', (req, res) => {
  res.json({ ok: true, rooms: publicRooms().length, sockets: io.engine.clientsCount });
});

// Now-playing / listener counts, proxied from Icecast.
//
// Proxying rather than calling Icecast from the browser buys three things: the
// page can be served over TLS without mixed-content breakage, JSONP goes away,
// and the stream host stops being baked into client JS. Every client polls this
// on a timer, so a short cache keeps one Icecast hit per interval regardless of
// how many listeners are connected.
router.get('/api/status', async (req, res) => {
  try {
    res.json(await getStreamStatus());
  } catch {
    res.status(502).json({ online: false, error: 'stream status unavailable' });
  }
});

// the-ham.org video status, proxied from nginx-rtmp's stat.xml.
//
// stat.xml has no CORS header (the .m3u8/.ts do), so the browser can't read it
// directly. This proxy discovers whatever is publishing under the `live` app
// and hands back a ready-to-play HLS URL, so the client never hardcodes a
// stream key and gets a clean offline state when nothing is broadcasting --
// which, per the nginx logs, is most of the time.
router.get('/api/live', async (req, res) => {
  try {
    res.json(await getHamStatus());
  } catch {
    res.status(502).json({ online: false, error: 'live status unavailable' });
  }
});

// Last.fm sidebar data, proxied so the API key stays on the server.
//
// The key used to be hardcoded in src/js/radio.js (4x) and shipped in the
// bundle. It's read-only public data, so the exposure was mild, but a
// credential in client JS is a credential you can't rotate quietly.
//
// Strictly allowlisted -- method, period and limit are all constrained, so
// this can't be turned into an open relay for arbitrary Last.fm calls.
const LASTFM_METHODS = new Set([
  'user.gettopartists',
  'user.gettoptracks',
  'user.gettopalbums',
  'user.getrecenttracks',
]);
const LASTFM_PERIODS = new Set(['overall', '7day', '1month', '3month', '6month', '12month']);
const LASTFM_CACHE_MS = 60000;
const lastfmCache = new Map();

router.get('/api/lastfm', async (req, res) => {
  const method = String(req.query.method ?? '');
  if (!LASTFM_METHODS.has(method)) {
    res.status(400).json({ error: 'unsupported method' });
    return;
  }
  if (!config.lastfmKey) {
    res.status(503).json({ error: 'lastfm not configured' });
    return;
  }

  const period = LASTFM_PERIODS.has(String(req.query.period)) ? String(req.query.period) : '12month';
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const cacheKey = `${method}:${period}:${limit}`;

  const hit = lastfmCache.get(cacheKey);
  if (hit && Date.now() - hit.at < LASTFM_CACHE_MS) {
    res.json(hit.value);
    return;
  }

  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.searchParams.set('method', method);
  url.searchParams.set('user', config.lastfmUser);
  url.searchParams.set('api_key', config.lastfmKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(limit));
  // getrecenttracks has no notion of a period.
  if (method !== 'user.getrecenttracks') url.searchParams.set('period', period);

  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error(`lastfm responded ${upstream.status}`);
    const value = await upstream.json();
    lastfmCache.set(cacheKey, { at: Date.now(), value });
    res.json(value);
  } catch {
    res.status(502).json({ error: 'lastfm unavailable' });
  }
});

// Broadcast a message to every active room.
router.post('/api/broadcast', requireAuthentication, (req, res) => {
  const text = typeof req.body?.msg === 'string' ? req.body.msg.trim() : '';
  if (!text) {
    res.status(400).send('No message provided');
    return;
  }
  sendBroadcast(validator.escape(text.slice(0, MAX_MESSAGE_LENGTH)));
  res.status(201).send('Message sent to all rooms');
});

// Local dev only: serve the shared site chrome (/embed/chrome.js + its fonts)
// by proxying to the main site.
//
// index.html loads /embed/chrome.js root-relative. In production that path is
// served by Apache from the WordPress docroot, alongside /radio -- nginx only
// routes /radio/ here, so this never runs there. Locally there's no Apache in
// front, so without this the chrome would 404 and the page would render bare.
// Unset DAW_ORIGIN => not mounted at all.
if (config.dawOrigin) {
  app.use('/embed', async (req, res) => {
    try {
      const upstream = await fetch(new URL(`/embed${req.url}`, config.dawOrigin), {
        signal: AbortSignal.timeout(5000),
      });
      if (!upstream.ok) {
        res.sendStatus(upstream.status);
        return;
      }
      const type = upstream.headers.get('content-type');
      if (type) res.type(type);
      res.send(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      res.sendStatus(502);
    }
  });
  logger.emit('newEvent', 'embedProxyEnabled', { origin: config.dawOrigin });
}

// Canonicalize /radio -> /radio/ before the router sees it. Without the
// trailing slash the browser resolves the page's relative asset URLs against
// the parent directory, so every script and stylesheet 404s.
//
// The exact `req.path ===` test matters: Express's default non-strict routing
// treats '/radio' and '/radio/' as the same route, so a plain
// app.get(basePath) would also match the slashed URL and redirect it to
// itself, forever.
if (config.basePath) {
  app.use((req, res, next) => {
    if (req.path === config.basePath) res.redirect(301, `${config.basePath}/`);
    else next();
  });
}

app.use(config.basePath || '/', router);

// ***************************************************************************
// Helpers
// ***************************************************************************

// Placeholder, as it has always been. Kept so the broadcast route has an
// obvious place to grow one rather than pretending the gap isn't there.
function requireAuthentication(req, res, next) {
  next();
}

// socket.io keeps a private room per socket, keyed by socket id. `sids` lets us
// tell those apart from rooms people actually joined.
function publicRooms() {
  const { rooms, sids } = io.of('/').adapter;
  const named = [];
  for (const key of rooms.keys()) {
    if (!sids.has(key)) named.push(key);
  }
  return named;
}

// Rooms this socket joined, minus its own private room.
function joinedRooms(socket) {
  return [...socket.rooms].filter((room) => room !== socket.id);
}

// Room names become DOM ids and jQuery selectors on the client, so keep them to
// a charset that can't break out of either.
function cleanRoomName(value) {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, MAX_ROOM_LENGTH);
  return cleaned || null;
}

function cleanNickname(value) {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 25);
  return cleaned.length >= 3 ? cleaned : null;
}

// Icecast reports `source` as an object for one mount, an array for several,
// and omits it entirely when nothing is broadcasting -- which is the off-air
// case the player draws.
function normalizeIcecastStatus(payload, mount) {
  const stats = payload?.icestats ?? {};
  const sources = stats.source == null ? [] : [].concat(stats.source);
  const source =
    sources.find((s) => typeof s?.listenurl === 'string' && s.listenurl.endsWith(mount)) ??
    sources[0];

  if (!source) return { online: false };

  // `bitrate` is kbps; `audio_bitrate` is bps. Only one is usually present,
  // depending on how the source client connected.
  const bitrate =
    source.bitrate ?? (source.audio_bitrate ? Math.round(source.audio_bitrate / 1000) : null);

  return {
    online: true,
    title: source.title ?? source.yp_currently_playing ?? null,
    // Icecast's mount `genre` field, repurposed as the current playlist/set name
    // (e.g. "June 2016"). It's set in the broadcast metadata, so it changes when
    // the source is reconfigured, not per-track.
    genre: source.genre ?? null,
    listeners: source.listeners ?? 0,
    peakListeners: source.listener_peak ?? 0,
    bitrate,
  };
}

const STATUS_CACHE_MS = 5000;
let statusCache = { at: 0, value: null };

async function getStreamStatus() {
  const now = Date.now();
  if (statusCache.value && now - statusCache.at < STATUS_CACHE_MS) return statusCache.value;

  const upstream = await fetch(config.streamStatusUrl, { signal: AbortSignal.timeout(5000) });
  if (!upstream.ok) throw new Error(`icecast responded ${upstream.status}`);

  const value = normalizeIcecastStatus(await upstream.json(), config.streamMount);
  statusCache = { at: now, value };
  return value;
}

// Parse nginx-rtmp stat.xml for a live publisher under `app`.
//
// The XML is small and machine-generated, so targeted regex is enough (Node has
// no built-in XML parser and this doesn't warrant a dependency). While nothing
// is publishing there's no <stream> node at all under the app's <live>; while
// publishing there's <stream><name>…</name>…<publishing/> plus a <meta><video>.
// The <publishing/> marker is the definitive "a source is connected" signal.
function parseHamStat(xml, app) {
  // Narrow to the target application's block.
  const appRe = new RegExp(
    `<application>\\s*<name>\\s*${app}\\s*</name>([\\s\\S]*?)</application>`,
    'i',
  );
  const appBlock = appRe.exec(xml)?.[1];
  if (!appBlock) return { online: false };

  // Only streams with an active publisher count as live.
  for (const m of appBlock.matchAll(/<stream>([\s\S]*?)<\/stream>/g)) {
    const s = m[1];
    if (!/<publishing\/>/.test(s)) continue;
    const name = /<name>([\s\S]*?)<\/name>/.exec(s)?.[1]?.trim();
    if (!name) continue;
    const width = Number(/<width>(\d+)<\/width>/.exec(s)?.[1]) || null;
    const height = Number(/<height>(\d+)<\/height>/.exec(s)?.[1]) || null;
    return {
      online: true,
      name,
      // .m3u8/.ts carry CORS, so the client plays this URL directly.
      hlsUrl: new URL(`${encodeURIComponent(name)}.m3u8`, config.hamHlsBase).href,
      width,
      height,
    };
  }
  return { online: false };
}

const HAM_CACHE_MS = 8000;
let hamCache = { at: 0, value: null };

async function getHamStatus() {
  const now = Date.now();
  if (hamCache.value && now - hamCache.at < HAM_CACHE_MS) return hamCache.value;

  const upstream = await fetch(config.hamStatUrl, { signal: AbortSignal.timeout(5000) });
  if (!upstream.ok) throw new Error(`the-ham stat responded ${upstream.status}`);

  const value = parseHamStat(await upstream.text(), config.hamApp);
  hamCache = { at: now, value };
  return value;
}

function sendBroadcast(text) {
  for (const room of publicRooms()) {
    io.to(room).emit('newMessage', {
      room,
      username: 'Radio-Robbot',
      msg: text,
      date: new Date(),
    });
  }
  logger.emit('newEvent', 'newBroadcastMessage', { msg: text });
}

// ***************************************************************************
// Socket.io
// ***************************************************************************

const io = new Server(server, {
  // Must line up with the client and with the proxy's websocket location.
  path: `${config.basePath}/socket.io`,
});

io.on('connection', (socket) => {
  // Per-socket state lives here instead of Redis. It survives exactly as long
  // as the connection does, which is all it ever needed to do, and it works
  // unchanged whether or not the Redis adapter is enabled.
  socket.data.username = 'anonymous';
  socket.data.connectedAt = new Date();

  socket.emit('connected', 'Welcome to the chat server');
  logger.emit('newEvent', 'userConnected', { socket: socket.id });

  socket.join(config.mainRoom);
  logger.emit('newEvent', 'userJoinsRoom', { socket: socket.id, room: config.mainRoom });
  io.to(config.mainRoom).emit('userJoinsRoom', {
    room: config.mainRoom,
    username: socket.data.username,
    msg: '----- Joined -----',
    id: socket.id,
  });

  // No 'subscribe' / 'unsubscribe' / 'getRooms' handlers: there is one room and
  // everyone is in it. Dropping them server-side rather than only hiding the UI
  // is the point -- otherwise anyone could still emit 'subscribe' by hand and
  // wander off into a private room. Every socket joins config.mainRoom on
  // connect and never leaves, so the `socket.rooms.has(room)` check in
  // 'newMessage' below can only ever pass for that one room.

  socket.on('getUsersInRoom', async (data) => {
    const room = cleanRoomName(data?.room);
    if (!room) return;

    // Works across processes when the Redis adapter is on.
    const sockets = await io.in(room).fetchSockets();
    socket.emit('usersInRoom', {
      users: sockets.map((member) => ({
        room,
        username: member.data.username,
        id: member.id,
      })),
    });
  });

  socket.on('setNickname', (data) => {
    const nickname = cleanNickname(data?.username);
    if (!nickname) return;

    const oldUsername = socket.data.username;
    socket.data.username = nickname;
    logger.emit('newEvent', 'userSetsNickname', {
      socket: socket.id,
      oldUsername,
      newUsername: nickname,
    });

    for (const room of joinedRooms(socket)) {
      io.to(room).emit('userNicknameUpdated', {
        room,
        oldUsername,
        newUsername: nickname,
        id: socket.id,
      });
    }
  });

  socket.on('newMessage', (data) => {
    const room = cleanRoomName(data?.room);
    const text = typeof data?.msg === 'string' ? data.msg.trim() : '';
    if (!room || !text) return;

    // Only relay to rooms this socket actually joined.
    if (!socket.rooms.has(room)) return;

    const message = {
      room,
      username: socket.data.username,
      msg: text.slice(0, MAX_MESSAGE_LENGTH),
      date: new Date(),
    };
    io.to(room).emit('newMessage', message);
    logger.emit('newEvent', 'newMessage', message);
  });

  // 'disconnecting' fires while socket.rooms is still populated; by the time
  // 'disconnect' runs it has been cleared, so departure notices must go out
  // from here.
  socket.on('disconnecting', () => {
    logger.emit('newEvent', 'userDisconnected', {
      socket: socket.id,
      username: socket.data.username,
    });

    for (const room of joinedRooms(socket)) {
      io.to(room).emit('userLeavesRoom', {
        room,
        username: socket.data.username,
        msg: '----- Left the room -----',
        id: socket.id,
      });
    }
  });
});

// ***************************************************************************
// Startup
// ***************************************************************************

async function connectRedisAdapter(url) {
  const { createClient } = await import('redis');
  const { createAdapter } = await import('@socket.io/redis-adapter');

  const pubClient = createClient({ url });
  const subClient = pubClient.duplicate();
  pubClient.on('error', (err) => logger.emit('newEvent', 'redisError', { msg: err.message }));
  subClient.on('error', (err) => logger.emit('newEvent', 'redisError', { msg: err.message }));

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  return [pubClient, subClient];
}

let redisClients = [];

if (config.redisUrl) {
  redisClients = await connectRedisAdapter(config.redisUrl);
  logger.emit('newEvent', 'redisAdapterEnabled', {});
} else {
  logger.emit('newEvent', 'redisAdapterDisabled', { reason: 'REDIS_URL not set; single process' });
}

if (config.debug) {
  setInterval(() => sendBroadcast('Testing rooms'), 60000);
}

server.listen(config.port, () => {
  logger.emit('newEvent', 'serverStarted', {
    port: config.port,
    basePath: config.basePath || '/',
    mainRoom: config.mainRoom,
  });
});

async function shutdown(signal) {
  logger.emit('newEvent', 'shuttingDown', { signal });
  await io.close();
  await Promise.all(redisClients.map((client) => client.quit().catch(() => {})));
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
