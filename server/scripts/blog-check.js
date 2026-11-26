#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { env } from '../src/lib/env.js';
import { closePool, many } from '../src/lib/db.js';
import { cleanBlogHtml, postSchema } from '../src/lib/blog.js';
import sharp from 'sharp';

let checks = 0;
function ok(condition, label) { assert.ok(condition, label); console.log('PASS ' + label); checks++; }
const before = JSON.parse(await fs.readFile(process.env.BLOG_BASELINE, 'utf8'));
const server = createApp().listen(0, '127.0.0.1');
await once(server, 'listening');
const base = process.env.BLOG_BASE || 'http://127.0.0.1:' + server.address().port;
let cookie = '';
let imageId, postId;
async function call(path, method = 'GET', data, extra = {}) {
  const response = await fetch(base + '/api' + path, {
    method, headers: { ...(cookie ? { cookie } : {}), ...(data && !Buffer.isBuffer(data) ? { 'Content-Type': 'application/json' } : {}), ...extra },
    ...(data ? { body: Buffer.isBuffer(data) ? data : JSON.stringify(data) } : {}),
  });
  const type = response.headers.get('content-type') || '';
  return { status: response.status, headers: response.headers, data: type.includes('json') ? await response.json() : await response.arrayBuffer() };
}
try {
  ok((await call('/blog')).status === 401, 'logged out blog is protected');
  ok((await call('/blog/images/00000000-0000-4000-8000-000000000000')).status === 401, 'logged out images are protected');
  const auth = await call('/auth/unlock', 'POST', { passcode: env.LEDGER_PASSCODE }, { 'User-Agent': 'ledger-blog-check-' + Date.now() });
  ok(auth.status === 200, 'unlock');
  cookie = auth.headers.get('set-cookie').split(';')[0];
  ok((await call('/blog')).headers.get('cache-control').includes('no-store'), 'blog is not cached');
  const malicious = '<script>alert(1)</script><p style="text-align:center;background:url(javascript:alert(1))" onclick="alert(1)"><strong>safe</strong></p><img src=x onerror=alert(1)><a href="javascript:alert(1)">no</a><svg onload=alert(1)></svg><iframe src="https://evil.test"></iframe>';
  const clean = cleanBlogHtml(malicious);
  ok(!/script|onclick|onerror|javascript|iframe|svg|background/i.test(clean), 'HTML strips XSS and external image beacons');
  ok(clean.includes('text-align:center') && clean.includes('<strong>safe</strong>'), 'HTML preserves supported formatting');
  ok(!postSchema.safeParse({postDate:'2026-02-30'}).success, 'invalid calendar dates refused');
  ok((await call('/blog', 'POST', {postDate:'2026-11-27'}, {Origin:'https://evil.test'})).status === 403, 'cross-origin writes refused');
  ok((await call('/blog/images', 'POST', Buffer.from('<svg></svg>'), {'Content-Type':'image/png'})).status === 400, 'image MIME spoof rejected');
  ok((await call('/blog/images', 'POST', Buffer.alloc(2097153), {'Content-Type':'image/png'})).status === 413, 'upload size enforced');
  const png = await sharp({create:{width:80,height:60,channels:3,background:'#54766b'}}).png().toBuffer();
  const image = await call('/blog/images', 'POST', png, {'Content-Type':'image/png'});
  ok(image.status === 201, 'durable image upload');
  imageId = image.data.id;
  const storedImage = await call('/blog/images/' + imageId);
  ok(storedImage.status === 200 && storedImage.headers.get('content-type') === 'image/webp', 'image safely re-encoded to raster WebP');
  const seed = {title:'Blog verification ' + Date.now(),slug:'',status:'draft',postDate:'2026-11-27',coverImage:image.data.url,html:malicious + '<img src="' + image.data.url + '" alt="Test image"><h2>Heading</h2><ul><li>one</li></ul><blockquote>quote</blockquote><pre><code>const a = 1;</code></pre>'};
  const created = await call('/blog', 'POST', seed);
  ok(created.status === 201, 'create draft');
  postId = created.data.post.id;
  let p = created.data.post;
  ok(p.status === 'draft' && p.version === 1 && p.slug.startsWith('blog-verification'), 'draft metadata and generated slug');
  ok(!p.html.includes('script') && p.html.includes(image.data.url), 'saved body sanitized with uploaded image preserved');
  ok((await call('/blog')).data.posts.some(row => row.id === postId), 'list includes draft');
  ok((await call('/blog/' + postId)).data.post.html === p.html, 'read persists full body');
  ok((await call('/blog/images/' + imageId, 'DELETE')).status === 409, 'used images cannot be deleted');
  const update = await call('/blog/' + postId, 'PUT', {...seed,slug:p.slug,status:'published',version:p.version});
  ok(update.status === 200 && update.data.post.status === 'published' && update.data.post.version === 2, 'publish with optimistic version');
  ok((await call('/blog/' + postId, 'PUT', {...seed,version:1})).status === 409, 'stale tab cannot overwrite');
  const duplicate = await call('/blog', 'POST', {...seed,slug:p.slug});
  ok(duplicate.status === 409, 'duplicate slug rejected');
  const unpublish = await call('/blog/' + postId, 'PUT', {...seed,slug:p.slug,status:'draft',version:2});
  ok(unpublish.status === 200 && unpublish.data.post.status === 'draft', 'published post can return to draft');
  ok((await call('/blog/' + postId, 'DELETE')).status === 200, 'delete test post');
  postId = null;
  ok((await call('/blog/images/' + imageId, 'DELETE')).status === 200, 'remove test-only unattached upload');
  imageId = null;
  ok((await call('/blog/not-a-uuid')).status === 404, 'malformed identifiers return 404');
} finally {
  if (postId) await call('/blog/' + postId, 'DELETE');
  if (imageId) await call('/blog/images/' + imageId, 'DELETE');
  if (cookie) {
    await call('/auth/lock', 'POST');
    ok((await call('/blog')).status === 401, 'own test session revoked');
  }
  server.close();
  for (const [table, rows] of Object.entries(before.tables)) {
    if (table === 'sessions' || table === 'schema_migrations') continue;
    const after = await many('select * from "' + table.replace(/"/g,'""') + '"');
    const stable = list => list.map(row => JSON.stringify(row)).sort();
    // Opt in only when the owner is editing finance concurrently. Still reject
    // any removed original row, changed account identity, or unrelated field.
    const concurrentFinance = process.env.BLOG_ALLOW_CONCURRENT_FINANCE === '1';
    const editableFields = table === 'accounts' ? ['note']
      : table === 'expense_payments' ? ['paid_on', 'paid_amount', 'updated_at'] : [];
    if (concurrentFinance && table === 'balances') {
      const originals = new Set(stable(after));
      assert.ok(stable(rows).every(row => originals.has(row)), 'every original balance row must remain unchanged');
      ok(true, 'preserved all original balances (' + rows.length + '); concurrent owner additions ' + (after.length - rows.length));
    } else if (concurrentFinance && editableFields.length) {
      const fixed = list => list.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => !editableFields.includes(key))));
      const preserved = new Set(stable(fixed(after)));
      assert.ok(stable(fixed(rows)).every(row => preserved.has(row)), table + ' original identities and all non-editable fields must remain unchanged');
      if (table !== 'accounts') assert.equal(after.length, rows.length, table + ' row count must remain unchanged');
      ok(true, 'preserved original ' + table + ' rows (' + rows.length + '); concurrent new rows ' + (after.length - rows.length) + ', editable fields ' + editableFields.join(', '));
    } else {
      assert.deepEqual(stable(after), stable(rows), table + ' must remain byte-for-byte unchanged');
      ok(after.length === rows.length, 'preserved all rows and fields in ' + table + ' (' + after.length + ')');
    }
  }
  const migrations = await many('select name from schema_migrations');
  ok(migrations.length === before.tables.schema_migrations.length + 1, 'only additive blog migration recorded');
  await closePool();
}
console.log(checks + ' checks passed');
