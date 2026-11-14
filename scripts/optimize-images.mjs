// Lightweight copies of the heavy pictures. Originals stay untouched; pages show the copies.
//
//   node scripts/optimize-images.mjs           # writes every copy listed below
//   node scripts/optimize-images.mjs --check   # fails if a copy is missing
//
// - Inventory cards: a 640px "thumb" next to each item picture (cards are ~300px wide,
//   so 640px is sharp on 2x screens); the detail window keeps the full image.
// - AgentF match screenshots: WebP previews for the matches window; the link still opens
//   the unaltered PNG, which is the evidence.
// - University page: WebP for the masterclass art and the certificate preview; the
//   "open full size" link still points at the original PNG.
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve, dirname, basename, extname} from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
function loadSharp() {
  const wranglerRequire = createRequire(require.resolve('../cloudflare/node_modules/wrangler/package.json'));
  return createRequire(wranglerRequire.resolve('miniflare/package.json'))('sharp');
}

/** Card thumbnails live in one folder, named after the source file. */
export const thumbOf = src => `assets/inventory/thumbs/${basename(src, extname(src))}.webp`;

function inventoryImages() {
  const sandbox = {window: {}};
  vm.runInNewContext(readFileSync(resolve(dist, 'inventory.js'), 'utf8'), sandbox);
  return sandbox.window.portfolioInventory.ITEMS.filter(item => item.image).map(item => item.image.src);
}

const jobs = [
  ...[...new Set(inventoryImages())].map(src => ({from: src, to: thumbOf(src), width: 640, quality: 78})),
  ...['match-total-attack', 'match-benchmark', 'match-fort-knox'].map(name => ({from: `assets/agentf/${name}.png`, to: `assets/agentf/${name}.webp`, width: 1200, quality: 82})),
  {from: 'projects/university/assets/masterclass-art.png', to: 'projects/university/assets/masterclass-art.webp', width: 1400, quality: 80},
  {from: 'projects/university/assets/certificate-public.png', to: 'projects/university/assets/certificate-public.webp', width: 1800, quality: 82}
];

if (check) {
  const missing = jobs.filter(job => !existsSync(resolve(dist, job.to)));
  if (missing.length) {
    console.error('Missing optimized copies (run node scripts/optimize-images.mjs):\n' + missing.map(job => '  ' + job.to).join('\n'));
    process.exit(1);
  }
  console.log(`${jobs.length} optimized copies present.`);
} else {
  const sharp = loadSharp();
  let before = 0, after = 0;
  for (const job of jobs) {
    const source = readFileSync(resolve(dist, job.from));
    const image = sharp(source);
    const {width} = await image.metadata();
    const output = await image.resize({width: Math.min(width, job.width), withoutEnlargement: true}).webp({quality: job.quality, effort: 6}).toBuffer();
    mkdirSync(dirname(resolve(dist, job.to)), {recursive: true});
    writeFileSync(resolve(dist, job.to), output);
    before += source.length; after += output.length;
    console.log(`${String(Math.round(source.length / 1024)).padStart(5)} KB -> ${String(Math.round(output.length / 1024)).padStart(4)} KB  ${job.to}`);
  }
  console.log(`total ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`);
}
