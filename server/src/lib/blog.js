import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';

export const imagePath = /^\/api\/blog\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(v + 'T00:00:00.000Z');
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === v;
}, 'invalid date');
export const postSchema = z.object({
  title: z.string().max(200).default(''),
  slug: z.string().max(160).regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/).default(''),
  status: z.enum(['draft', 'published']).default('draft'),
  postDate: date,
  coverImage: z.string().max(200).refine(v => !v || imagePath.test(v), 'upload a cover image first').default(''),
  html: z.string().max(200000).default(''),
  version: z.number().int().positive().optional(),
}).strict();

export function cleanBlogHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'hr'],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
      p: ['style'], h1: ['style'], h2: ['style'], h3: ['style'], h4: ['style'], h5: ['style'], h6: ['style'],
      ol: ['start'],
    },
    allowedStyles: { '*': { 'text-align': [/^(left|right|center|justify)$/] } },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowProtocolRelative: false,
    nestingLimit: 30,
    transformTags: {
      a: (tagName, attrs) => ({ tagName, attribs: { ...attrs, rel: 'noopener noreferrer' } }),
    },
    exclusiveFilter: frame => frame.tag === 'img' && !imagePath.test(frame.attribs.src || ''),
  });
}

export function slugFromTitle(title, suffix) {
  const stem = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 140).replace(/-$/, '') || 'untitled';
  return stem + '-' + suffix;
}

export const excerptFromHtml = html => sanitizeHtml(html.replace(/<\/(p|h[1-6]|li|blockquote)>/gi, ' '), { allowedTags: [], allowedAttributes: {} }).slice(0, 240);
