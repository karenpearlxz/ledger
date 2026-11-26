import crypto from 'node:crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { one, many, query } from '../lib/db.js';
import { route, badRequest, isoDate } from '../lib/http.js';
import { cleanBlogHtml, excerptFromHtml, postSchema, slugFromTitle } from '../lib/blog.js';

export const blogRouter = express.Router();
const uuid = z.string().uuid();
const fields = 'id, title, slug, status, post_date, cover_image, html, version, created_at, updated_at';
const listFields = 'id, title, slug, status, post_date, cover_image, left(html, 1200) as html, version, created_at, updated_at';
function post(row, body = true) {
  return {
    id: row.id, title: row.title, slug: row.slug, status: row.status,
    postDate: isoDate(row.post_date), coverImage: row.cover_image,
    ...(body ? { html: row.html } : {}), excerpt: excerptFromHtml(row.html),
    version: row.version, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

blogRouter.use((req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Cookies are SameSite=Lax, and cross-origin writes are refused as well.
    const origin = req.get('origin');
    let sameOrigin = true;
    if (origin) {
      try { sameOrigin = new URL(origin).host === req.get('host'); } catch { sameOrigin = false; }
    }
    if (!sameOrigin || req.get('sec-fetch-site') === 'cross-site') {
      return res.status(403).json({ error: 'open the blog in Ledger to make changes' });
    }
  }
  next();
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'too many image uploads, try again in a minute' },
});
blogRouter.post('/images', uploadLimiter,
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], limit: '2mb' }),
  route(async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length) {
      return res.status(400).json({ error: 'choose a JPEG, PNG, WebP or GIF, up to 2 MB' });
    }
    // Load the native decoder only for uploads. A packaging failure must not
    // take the rest of Ledger offline, and must not be reported as a bad photo.
    const { default: sharp } = await import('sharp');
    let bytes;
    try {
      const image = sharp(req.body, { limitInputPixels: 16000000, failOn: 'warning' });
      const meta = await image.metadata();
      if (!['jpeg', 'png', 'webp', 'gif'].includes(meta.format)) throw Error('unsupported');
      // Decode and re-encode raster pixels. No SVG, embedded scripts or EXIF location data survives.
      bytes = await image.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85, effort: 3 }).toBuffer();
      if (bytes.length > 2097152) throw Error('too large');
    } catch {
      return res.status(400).json({ error: 'invalid image, use JPEG, PNG, WebP or GIF under 2 MB and 16 megapixels' });
    }
    const row = await one("insert into blog_images (mime_type, bytes) values ('image/webp', $1) returning id", [bytes]);
    res.status(201).json({ id: row.id, url: '/api/blog/images/' + row.id });
  }),
);
blogRouter.get('/images/:id', route(async (req, res) => {
  if (!uuid.safeParse(req.params.id).success) return res.status(404).json({ error: 'image not found' });
  const row = await one('select mime_type, bytes from blog_images where id = $1', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'image not found' });
  res.set('Content-Type', row.mime_type).set('X-Content-Type-Options', 'nosniff').send(row.bytes);
}));

blogRouter.get('/', route(async (_req, res) => {
  const rows = await many('select ' + listFields + ' from blog_posts order by post_date desc, created_at desc');
  res.json({ posts: rows.map(row => post(row, false)) });
}));
blogRouter.get('/:id', route(async (req, res) => {
  if (!uuid.safeParse(req.params.id).success) return res.status(404).json({ error: 'post not found' });
  const row = await one('select ' + fields + ' from blog_posts where id = $1', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'post not found' });
  res.json({ post: post(row) });
}));

async function save(req, res, editing) {
  if (!req.is('application/json')) return res.status(415).json({ error: 'send JSON to save a post' });
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed);
  const p = parsed.data;
  if (editing && !uuid.safeParse(req.params.id).success) return res.status(404).json({ error: 'post not found' });
  if (editing && !p.version) return res.status(400).json({ error: 'reload this post before saving' });
  if (p.coverImage) {
    const exists = await one('select id from blog_images where id = $1', [p.coverImage.split('/').pop()]);
    if (!exists) return res.status(400).json({ error: 'cover image no longer exists, upload it again' });
  }
  const id = editing ? req.params.id : crypto.randomUUID();
  const slug = p.slug || slugFromTitle(p.title, id.slice(0, 8));
  const html = cleanBlogHtml(p.html);
  try {
    const values = [p.title, slug, p.status, p.postDate, p.coverImage, html, id];
    const row = editing
      ? await one('update blog_posts set title=$1, slug=$2, status=$3, post_date=$4, cover_image=$5, html=$6, version=version+1, updated_at=clock_timestamp() where id=$7 and version=$8 returning ' + fields, [...values, p.version])
      : await one('insert into blog_posts (title,slug,status,post_date,cover_image,html,id) values ($1,$2,$3,$4,$5,$6,$7) returning ' + fields, values);
    if (!row) {
      const exists = await one('select id from blog_posts where id=$1', [id]);
      return res.status(exists ? 409 : 404).json({ error: exists ? 'this post changed in another tab, copy your changes before reloading' : 'post not found' });
    }
    res.status(editing ? 200 : 201).json({ post: post(row) });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'that slug is already used, choose a different one' });
    throw err;
  }
}
blogRouter.post('/', route((req, res) => save(req, res, false)));
blogRouter.put('/:id', route((req, res) => save(req, res, true)));
blogRouter.delete('/:id', route(async (req, res) => {
  if (!uuid.safeParse(req.params.id).success) return res.status(404).json({ error: 'post not found' });
  const row = await one('delete from blog_posts where id=$1 returning id', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'post not found' });
  res.json({ ok: true });
}));

// Unattached uploads can be removed explicitly, but never remove an image used by a saved post.
blogRouter.delete('/images/:id', route(async (req, res) => {
  if (!uuid.safeParse(req.params.id).success) return res.status(404).json({ error: 'image not found' });
  const url = '/api/blog/images/' + req.params.id;
  const result = await query('delete from blog_images where id=$1 and not exists (select 1 from blog_posts where cover_image=$2 or position($2 in html)>0) returning id', [req.params.id, url]);
  if (!result.rowCount) return res.status(409).json({ error: 'image is in use or already removed' });
  res.json({ ok: true });
}));

blogRouter.use((err, _req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'images must be 2 MB or smaller' });
  next(err);
});
