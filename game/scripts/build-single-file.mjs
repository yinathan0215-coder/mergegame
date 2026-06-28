// build-single-file — post-build step (docs/60-implementation/tech-stack §제약: 단일 파일 배포본).
//
// The normal `vite build` emits a multi-file dist/ (index.html + assets/index-*.js + the PNG
// tree copied verbatim from public/). That output needs an HTTP server: the entry is a
// `<script type="module" src=…>` (browsers block external module scripts under file://) and the
// game loads its planet/UI/background PNGs by absolute `/assets/…` path (which resolves to the
// drive root under file://). This script folds that output into ONE self-contained html so it
// runs from a bare double-click:
//   1. inline every referenced CSS <link> and the entry JS into the page,
//   2. rewrite each `/assets/*.png` literal inside the JS to a base64 data URI,
//   3. write dist/galaxy-pinball.html.
// It reads the built dist/ only — it never touches src/ — so it stays clear of asset/source churn.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const OUT = resolve(DIST, 'galaxy-pinball.html');

const MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

// Turn an in-page asset reference (`/assets/x.png`, `./assets/x.png`, `assets/x.png`) into a
// base64 data URI by reading the matching file from dist/. Returns null if no file is found, so
// the caller can leave the literal untouched rather than emit a broken reference.
function dataUri(ref) {
  const rel = ref.replace(/^(\.?\/)/, '').replace(/^\//, '');
  const file = resolve(DIST, rel);
  if (!existsSync(file)) return null;
  const ext = rel.split('.').pop().toLowerCase();
  const mime = MIME[ext];
  if (!mime) return null;
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}

// Replace every quoted `…/assets/*.<img>` literal in a chunk of JS/CSS with its data URI.
function inlineAssetRefs(code) {
  let inlined = 0;
  const out = code.replace(
    /(["'`])((?:\.?\/)?assets\/[^"'`]+?\.(?:png|jpe?g|webp|gif|svg))\1/g,
    (whole, q, ref) => {
      const uri = dataUri(ref);
      if (!uri) return whole;
      inlined++;
      return `${q}${uri}${q}`;
    },
  );
  return { out, inlined };
}

let html = readFileSync(resolve(DIST, 'index.html'), 'utf8');
let totalAssets = 0;

// Inline CSS <link rel=stylesheet href="./assets/*.css"> (none today, but keep it self-contained).
html = html.replace(
  /<link\b[^>]*\bhref=["']([^"']+\.css)["'][^>]*>/g,
  (tag, href) => {
    const file = resolve(DIST, href.replace(/^(\.?\/)/, ''));
    if (!existsSync(file)) return tag;
    const { out, inlined } = inlineAssetRefs(readFileSync(file, 'utf8'));
    totalAssets += inlined;
    return `<style>${out}</style>`;
  },
);

// Inline the entry module script and base64 its asset literals.
html = html.replace(
  /<script\b[^>]*\bsrc=["']([^"']+\.js)["'][^>]*><\/script>/,
  (tag, src) => {
    const file = resolve(DIST, src.replace(/^(\.?\/)/, ''));
    if (!existsSync(file)) throw new Error(`entry JS not found: ${file}`);
    const { out, inlined } = inlineAssetRefs(readFileSync(file, 'utf8'));
    totalAssets += inlined;
    // Escape any literal </script> so the inline block can't be closed early.
    const safe = out.replace(/<\/script/gi, '<\\/script');
    return `<script type="module">${safe}</script>`;
  },
);

// Fail loud if anything external survived — a standalone file must reference nothing on disk.
const leftover = html.match(/(?:src|href)=["'][^"']*\/assets\/[^"']+["']/g);
if (leftover) {
  throw new Error(`single-file build left external refs:\n${leftover.join('\n')}`);
}

writeFileSync(OUT, html);
const kb = Math.round(Buffer.byteLength(html) / 1024);
console.log(`single-file build → dist/galaxy-pinball.html  (${kb} KB, ${totalAssets} assets inlined)`);
