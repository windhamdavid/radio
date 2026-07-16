// Replaces the old gulpfile. Gulp 3 cannot run on Node 12+, and the project is
// on Node 22, so the previous build was simply dead.
//
// Same contract as before: read src/, write the bundles app/ that app.js serves.
//
//   node build.mjs            build once
//   node build.mjs --watch    rebuild on change

import { rm, mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { existsSync, watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { transform } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'app');
const NODE_MODULES = path.join(__dirname, 'node_modules');

// Baked into the client bundle at build time. Must be https:// -- the page is
// served over TLS, so http:// stream URLs get blocked as mixed content.
const STREAM_URL = process.env.STREAM_URL ?? 'https://stream.davidawindham.com/stream';
const STREAM_STATUS_URL =
  process.env.STREAM_STATUS_URL ?? 'https://stream.davidawindham.com/status-json.xsl';
const STREAM_MOUNT = process.env.STREAM_MOUNT ?? '/stream';

const VENDOR_JS = [
  path.join(SRC, 'js/jquery-v2.1.4.js'),
  // Was src/js/bootstrap-v3.3.6.js. 3.4.1 patches the XSS fixed in 3.4.0/3.4.1
  // (data-target, and the collapse/affix/tooltip selectors).
  //
  // It does NOT clear `npm audit`: two XSS advisories cover all of 3.1.1-3.4.1
  // with no 3.x fix, because Bootstrap 3 went EOL in 2019. Both need
  // attacker-controlled content in a popover/tooltip or a data-* attribute,
  // and neither exists here -- the only tooltip is on static nav-tabs, and the
  // one templated data-* is a literal. Clearing the advisory outright means
  // Bootstrap 5, i.e. rewriting the markup. See _claude.md.
  path.join(NODE_MODULES, 'bootstrap/dist/js/bootstrap.js'),
  path.join(SRC, 'js/bootstrap-validator-v0.9.0.js'),
  path.join(SRC, 'js/bootstrap-progress-v0.9.0.js'),
  path.join(SRC, 'js/underscore-v1.8.3.js'),
  // Was src/js/handlebars-v4.0.5.js. Handlebars < 4.7.7 has a prototype
  // pollution RCE, so this now tracks the npm package instead of the checked-in
  // copy. The template syntax used here is unchanged between the two.
  path.join(NODE_MODULES, 'handlebars/dist/handlebars.min.js'),
];

const RADIO_JS = [
  // base.js must come first: it defines window.RADIO, the shared socket and
  // mount-path helper that the other two depend on.
  path.join(SRC, 'js/base.js'),
  path.join(SRC, 'js/chat.js'),
  path.join(SRC, 'js/amplitude-v2.2.0.js'),
  path.join(SRC, 'js/radio.js'),
];

const WEBRTC_JS = [
  path.join(SRC, 'js/webrtc-adapter.js'),
  path.join(SRC, 'js/webrtc-audio.js'),
  path.join(SRC, 'js/webrtc-video.js'),
];

// Bootstrap's CSS ships with its JS, so it tracks the same 3.4.1 package. Its
// glyphicon @font-face rules point at ../fonts/, which is what src/fonts/ is
// copied to (those files are byte-identical between 3.3.6 and 3.4.1).
// main.css comes last so it keeps overriding Bootstrap.
const CSS = [
  path.join(NODE_MODULES, 'bootstrap/dist/css/bootstrap.css'),
  path.join(SRC, 'css/main.css'),
];

const DEFINE = {
  __STREAM_URL__: JSON.stringify(STREAM_URL),
  __STREAM_STATUS_URL__: JSON.stringify(STREAM_STATUS_URL),
  __STREAM_MOUNT__: JSON.stringify(STREAM_MOUNT),
};

async function concat(files) {
  const parts = [];
  for (const file of files) {
    if (!existsSync(file)) throw new Error(`missing build input: ${path.relative(__dirname, file)}`);
    parts.push(await readFile(file, 'utf8'));
  }
  return parts.join('\n;\n');
}

async function bundleJs(files, outFile, { define } = {}) {
  const source = await concat(files);
  // These are old-style global scripts, not modules -- minify only, no bundling
  // or module resolution, or they'd lose their globals.
  const result = await transform(source, { loader: 'js', minify: true, define });
  await writeFile(path.join(OUT, outFile), result.code);
}

async function bundleCss(files, outFile) {
  const source = await concat(files);
  const result = await transform(source, { loader: 'css', minify: true });
  await writeFile(path.join(OUT, outFile), result.code);
}

async function build() {
  const started = Date.now();
  await rm(OUT, { recursive: true, force: true });
  await mkdir(path.join(OUT, 'js'), { recursive: true });
  await mkdir(path.join(OUT, 'css'), { recursive: true });

  await cp(path.join(SRC, 'index.html'), path.join(OUT, 'index.html'));
  await cp(path.join(SRC, 'img'), path.join(OUT, 'img'), { recursive: true });
  await cp(path.join(SRC, 'fonts'), path.join(OUT, 'fonts'), { recursive: true });
  await cp(path.join(SRC, 'js/templates'), path.join(OUT, 'js/templates'), { recursive: true });

  await bundleCss(CSS, 'css/style.min.css');
  await bundleJs(VENDOR_JS, 'js/vendor.min.js');
  await bundleJs(RADIO_JS, 'js/radio.min.js', { define: DEFINE });
  await bundleJs(WEBRTC_JS, 'js/webrtc.min.js');

  console.log(`BUILD: complete in ${Date.now() - started}ms -> ${path.relative(__dirname, OUT)}/`);
}

await build();

if (process.argv.includes('--watch')) {
  let queued = null;
  watch(SRC, { recursive: true }, () => {
    clearTimeout(queued);
    queued = setTimeout(() => build().catch((err) => console.error('BUILD FAILED:', err.message)), 100);
  });
  console.log('WATCH: watching src/');
}
