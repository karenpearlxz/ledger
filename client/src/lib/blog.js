import { notifyLocked } from './api.js';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const todayManila = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

export const slugify = (s) => String(s || '')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);

export const isEmptyHtml = (html) => !html || /^(<p><\/p>|<p><br\s*\/?><\/p>)?$/.test(html.trim());

/** Raw binary upload. Returns { url, id } or throws Error with a readable message. */
export async function uploadImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Only JPEG, PNG, WEBP or GIF images.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Image is over 2 MB.');
  let res;
  try {
    res = await fetch('/api/blog/images', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': file.type },
      body: file,
    });
  } catch {
    throw new Error('you look offline');
  }
  if (res.status === 401) { notifyLocked(); throw new Error('locked'); }
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok || !data?.url) throw new Error(data?.error || `upload failed (${res.status})`);
  return data;
}

const draftKey = (id) => `ledger:blog-draft:${id}`;
export const readDraft = (id) => {
  try { return JSON.parse(sessionStorage.getItem(draftKey(id)) || 'null'); } catch { return null; }
};
export const writeDraft = (id, v) => { try { sessionStorage.setItem(draftKey(id), JSON.stringify(v)); } catch { /* quota */ } };
export const clearDraft = (id) => { try { sessionStorage.removeItem(draftKey(id)); } catch { /* ignore */ } };

// Recovery copies are tab-local and are discarded whenever Ledger locks.
export function clearBlogDrafts() {
  try {
    for (const key of Object.keys(sessionStorage)) if (key.startsWith('ledger:blog-draft:')) sessionStorage.removeItem(key);
  } catch { /* unavailable storage */ }
}
