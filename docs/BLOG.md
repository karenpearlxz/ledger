# Blog

Ledger's private Blog is available at `/blog` on both deployments. Draft and Published are editorial states, not public sharing. All posts and image bytes require the existing passcode session.

## Editing

Create a post from Blog, enter a title and write in the rich-text canvas. Changes autosave after a short pause. An unsaved recovery copy is held only in the current tab and is cleared when Ledger locks. A conflicting edit from another tab pauses saving and offers Keep mine or Load theirs.

The editor supports headings, bold, italic, underline, strike, ordered and unordered lists, quotes, inline code, links, text alignment, undo and redo. Standard editing shortcuts work, including Ctrl/Cmd+B, I, U, K, Z, Y, S and P. Images can be selected, pasted or dropped into the canvas. Raster JPEG, PNG, WebP and GIF files are limited to 2 MiB and 16 megapixels; accepted images are decoded and stored as WebP in Postgres, not on a temporary filesystem.

## Persistence and security

`012_blog.sql` adds only `ledger.blog_posts` and `ledger.blog_images`. Posts have optimistic integer versions to reject stale writes. HTML is sanitized on every save, with an explicit formatting allowlist, safe links, and authenticated local image URLs. SVG and HTML image uploads, cross-origin writes and invalid metadata are rejected. The feature does not change existing Journal, Figures, finance or Swertres tables.

The pre-migration full backup is outside the repository in `/home/kit/ledger-backups/before-blog-migration-2026-11-26T17-09-40-342Z-59e89c.json`, mode 0600. Keep backups private; they contain personal data.

## Deployment

Run `npm run build` before committing. Local service uses the existing `bash server/scripts/restart.sh` and port 8600, persisted by `/.hako/init.sh`. Push master to the existing `origin` and `karenpearlxz` remotes; the latter deploys Vercel.

There are separate Express entrypoints in `server/src/app.js` and `api/index.js`. Both mount the authenticated Blog router. Sharp is loaded only for uploads. Vercel explicitly includes the native Sharp packages. The pinned Node 24 runtime and `NODE_OPTIONS=--experimental-require-module` are required by the current sanitizer's ESM parser dependency, per Vercel's advanced Node configuration documentation. Do not downgrade the sanitizer to work around runtime configuration.

## Verification

`BLOG_BASE=https://ledger-six-delta-88.vercel.app BLOG_BASELINE=/absolute/private/backup.json node server/scripts/blog-check.js` runs the API/security suite against the chosen host. It creates and deletes its own fixtures and revokes its session. With the baseline provided, it also compares every original non-session table row and field against the full backup, allowing only the new migration record. Run the same suite against the private HTTPS host.

The browser suite in `server/scripts/blog-ui-check.mjs` exercises desktop and 390px layouts on both real HTTPS deployments. Run it only when live fixture writes are acceptable. It deletes only its own uniquely named test posts and uploaded images, locks all its sessions, and writes screenshots and evidence under `/tmp`.

If the owner is actively updating finances, opt into `BLOG_ALLOW_CONCURRENT_FINANCE=1`. This permits only new account/balance rows, existing account-note edits, and existing payment paid-date/amount/timestamp edits. Original balance rows and every other field/table must still match the pre-migration backup exactly. Without this explicit flag, all original tables are compared byte-for-byte. Never overwrite owner edits to make a preservation test pass.
