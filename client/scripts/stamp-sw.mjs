#!/usr/bin/env node
/**
 * Injects the built asset filenames and a build id into dist/sw.js.
 * Without this the worker precaches only '/', and the first offline reload
 * serves an HTML shell whose scripts all 404.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const swPath = path.join(dist, 'sw.js');

const assets = readdirSync(path.join(dist, 'assets'))
  .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
  .map((f) => `/assets/${f}`);

if (!assets.length) {
  console.error('[stamp-sw] no built assets found — refusing to ship a worker that caches nothing');
  process.exit(1);
}

const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
// Backend route changes must invalidate the installed shell too.
const api = readFileSync(path.join(root, '../api/index.js'), 'utf8');
const build = createHash('sha256').update(html + assets.join(',') + api).digest('hex').slice(0, 12);

const source = readFileSync(swPath, 'utf8')
  // replaceAll, not replace: the placeholders are also named in the file's
  // own header comment, so replacing only the first left the real ones intact.
  .replaceAll('__BUILD__', build)
  .replaceAll('__ASSETS__', JSON.stringify(assets));

if (source.includes('__ASSETS__') || source.includes('__BUILD__')) {
  console.error('[stamp-sw] placeholders left in sw.js');
  process.exit(1);
}

writeFileSync(swPath, source);
console.log(`[stamp-sw] build ${build}, ${assets.length} assets precached`);
