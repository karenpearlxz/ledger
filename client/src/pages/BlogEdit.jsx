import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ConfirmButton, Skeleton } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import {
  blogDraftEpoch, clearDraft, IMAGE_TYPES, isEmptyHtml, readDraft, slugify, todayManila, uploadImage, writeDraft,
} from '../lib/blog.js';
import { useApp } from '../lib/store.jsx';

const AUTOSAVE_MS = 1200;
const RETRY_MS = 5000;
const isMod = (e) => (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey;

const STATUS_TEXT = {
  clean: 'All changes saved',
  dirty: 'Unsaved changes…',
  saving: 'Saving…',
  offline: 'Offline, will retry',
  error: 'Could not save',
  conflict: 'Edited elsewhere',
};

function Tb({ label, active, disabled, onClick, children, testid }) {
  return (
    <button
      type="button"
      className={`tb${active ? ' on' : ''}`}
      aria-label={label}
      title={label}
      aria-pressed={active === undefined ? undefined : !!active}
      disabled={disabled}
      data-testid={testid}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const AlignIcon = ({ kind }) => {
  const rows = { left: [4, 20, 4, 14, 4, 18], center: [4, 20, 7, 17, 5, 19], right: [4, 20, 10, 20, 6, 20] };
  const [a1, b1, a2, b2, a3, b3] = rows[kind];
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d={`M${a1} 7H${b1}M${a2} 12H${b2}M${a3} 17H${b3}`} />
    </svg>
  );
};

export default function BlogEdit() {
  const { id: param } = useParams();
  const navigate = useNavigate();
  const { toast } = useApp();

  const [loading, setLoading] = useState(param !== 'new');
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({
    title: '', slug: '', status: 'draft', postDate: todayManila(), coverImage: '',
  });
  const [saveState, setSaveState] = useState('clean');
  const [saveMsg, setSaveMsg] = useState('');
  const [uploading, setUploading] = useState(0);
  const [created, setCreated] = useState(param !== 'new');
  const [restore, setRestore] = useState(null);
  const [armed, setArmed] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Everything the saver touches lives in refs so a save that was queued a
  // second ago can never read a stale closure.
  const idRef = useRef(param === 'new' ? null : param);
  const versionRef = useRef(0);
  const latest = useRef({ ...form, html: '' });
  const rev = useRef(0);
  const savedRev = useRef(0);
  const loop = useRef(null);
  const timer = useRef(null);
  const blocked = useRef(false);
  const dead = useRef(false);
  const locked = useRef(false);
  const draftEpoch = useRef(blogDraftEpoch());
  const editorRef = useRef(null);
  const printRef = useRef(null);
  const fileRef = useRef(null);
  const coverRef = useRef(null);
  const loadToken = useRef(0);

  const draftId = () => idRef.current || 'new';

  const runLoop = useCallback(async () => {
    while (rev.current > savedRev.current && !blocked.current && !locked.current && draftEpoch.current === blogDraftEpoch()) {
      const myRev = rev.current;
      const snap = { ...latest.current };
      if (!idRef.current && !snap.title.trim() && isEmptyHtml(snap.html) && !snap.coverImage) {
        savedRev.current = myRev; // nothing worth creating yet
        break;
      }
      setSaveState('saving');
      try {
        let res;
        if (!idRef.current) {
          res = await api.post('/blog', snap);
          idRef.current = res.post.id;
          // Edits typed while the POST was in flight were recovered under 'new'.
          // Never delete them: move the newest copy to the real id.
          if (rev.current === myRev) clearDraft('new');
          else if (!locked.current && draftEpoch.current === blogDraftEpoch()) {
            writeDraft(res.post.id, { form: latest.current, at: Date.now() });
            clearDraft('new');
          }
          latest.current.slug = res.post.slug; // lock the generated slug in
          setForm((f) => ({ ...f, slug: res.post.slug }));
          setCreated(true);
          if (!dead.current) navigate(`/blog/${res.post.id}`, { replace: true });
        } else {
          res = await api.put(`/blog/${idRef.current}`, { ...snap, version: versionRef.current });
        }
        versionRef.current = res.post.version;
        savedRev.current = myRev;
        if (rev.current === myRev) clearDraft(draftId());
        else if (!locked.current && draftEpoch.current === blogDraftEpoch()) writeDraft(draftId(), { form: latest.current, at: Date.now() });
      } catch (e) {
        if (e.status === 401) { locked.current = true; setSaveState('error'); setSaveMsg('Locked. Unlock to keep saving.'); return; }
        if (e.status === 409 && !e.message.includes('slug')) { blocked.current = true; setSaveState('conflict'); return; }
        if (e.status === 0 || e.status >= 500) {
          setSaveState('offline');
          clearTimeout(timer.current);
          timer.current = setTimeout(() => flush(), RETRY_MS);
          return;
        }
        setSaveState('error');
        setSaveMsg(e.message);
        return;
      }
    }
    if (rev.current === savedRev.current && !blocked.current) { setSaveState('clean'); setSaveMsg(''); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // One loop at a time. Callers share the running loop, then it re-checks the
  // revision counter, so an edit made mid-save is picked up by the same loop.
  function flush() {
    clearTimeout(timer.current);
    if (!loop.current) loop.current = runLoop().finally(() => { loop.current = null; });
    return loop.current;
  }
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const isClean = () => rev.current === savedRev.current;

  const change = useCallback((patch) => {
    latest.current = { ...latest.current, ...patch };
    rev.current += 1;
    if (draftEpoch.current === blogDraftEpoch()) writeDraft(draftId(), { form: latest.current, at: Date.now() });
    setSaveState((s) => (s === 'conflict' ? s : 'dirty'));
    if (!blocked.current) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => flushRef.current(), AUTOSAVE_MS);
    }
  }, []);

  const setField = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    change({ [k]: v });
  };

  // ---- images ---------------------------------------------------------
  const insertImages = useCallback(async (files, pos) => {
    const ed = editorRef.current;
    for (const file of files) {
      setUploading((n) => n + 1);
      try {
        const { url } = await uploadImage(file);
        const attrs = { src: url, alt: file.name ? file.name.replace(/\.[^.]+$/, '') : '' };
        if (!editorRef.current || dead.current || editorRef.current !== ed) continue;
        if (pos != null) { ed.chain().focus().insertContentAt(pos, { type: 'image', attrs }).run(); pos += 2; }
        else ed.chain().focus().setImage(attrs).run();
      } catch (e) {
        if (e.message !== 'locked') toast(e.message, 'error');
      } finally { setUploading((n) => n - 1); }
    }
  }, [toast]);

  const imageFiles = (list) => Array.from(list || []).filter((f) => IMAGE_TYPES.includes(f.type));

  const openLink = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    setLinkUrl(ed.getAttributes('link').href || '');
    setLinkOpen(true);
  }, []);

  const fillPrint = useCallback(() => {
    const ed = editorRef.current;
    if (!ed || !printRef.current) return false;
    const L = latest.current || {};
    const nodes = [];
    if (L.coverImage) {
      const img = document.createElement('img');
      img.src = L.coverImage;
      img.alt = '';
      img.style.cssText = 'max-width:100%;height:auto;margin:0 0 12pt;display:block';
      nodes.push(img);
    }
    const h = document.createElement('h1');
    h.textContent = L.title || 'Untitled';
    nodes.push(h);
    if (L.postDate) {
      const d = document.createElement('p');
      d.textContent = L.postDate;
      nodes.push(d);
    }
    const body = document.createElement('div');
    body.innerHTML = ed.getHTML();
    nodes.push(body);
    printRef.current.replaceChildren(...nodes);
    return true;
  }, []);

  const printNow = useCallback(() => {
    if (fillPrint()) window.print();
  }, [fillPrint]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true } }),
      Image.configure({ allowBase64: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: '',
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { class: 'blog-prose', 'data-testid': 'blog-editor', 'aria-label': 'Post body' },
      handleKeyDown: (_v, e) => {
        if (isMod(e) && e.key.toLowerCase() === 'k') { e.preventDefault(); openLink(); return true; }
        return false;
      },
      handlePaste: (_v, e) => {
        const files = imageFiles(e.clipboardData?.files);
        if (!files.length) return false;
        e.preventDefault();
        insertImages(files);
        return true;
      },
      handleDrop: (view, e, _s, moved) => {
        if (moved) return false;
        const files = imageFiles(e.dataTransfer?.files);
        if (!files.length) return false;
        e.preventDefault();
        const pos = view.posAtCoords({ left: e.clientX, top: e.clientY })?.pos;
        insertImages(files, pos ?? null);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => change({ html: ed.getHTML() }),
  });
  useEffect(() => { editorRef.current = editor; }, [editor]);

  // ---- loading --------------------------------------------------------
  const applyServer = useCallback((post) => {
    const f = {
      title: post.title, slug: post.slug, status: post.status, postDate: post.postDate, coverImage: post.coverImage || '',
    };
    setForm(f);
    latest.current = { ...f, html: post.html || '' };
    versionRef.current = post.version;
    editorRef.current?.commands.setContent(post.html || '', { emitUpdate: false });
  }, []);

  useEffect(() => {
    if (!editor) return undefined;
    if (param === idRef.current && (versionRef.current > 0 || param === 'new')) return undefined; // we just created it
    const token = ++loadToken.current;
    if (param === 'new') {
      idRef.current = null;
      const d = readDraft('new');
      if (d?.form && (d.form.title || !isEmptyHtml(d.form.html))) setRestore(d);
      setLoading(false);
      return undefined;
    }
    idRef.current = param;
    setLoading(true);
    setLoadError('');
    api.get(`/blog/${param}`).then(({ post }) => {
      if (token !== loadToken.current) return;
      applyServer(post);
      const d = readDraft(param);
      if (d?.form && (['html', 'title', 'coverImage', 'status', 'postDate', 'slug'].some((k) => (d.form[k] || '') !== (post[k] || '')))) setRestore(d);
      setLoading(false);
    }).catch((e) => {
      if (token !== loadToken.current) return;
      if (e.status !== 401) setLoadError(e.status === 404 ? 'That post does not exist.' : e.message);
      setLoading(false);
    });
    return undefined;
  }, [param, editor, applyServer]);

  function restoreDraft() {
    const d = restore.form;
    const f = { title: d.title || '', slug: d.slug || '', status: d.status || 'draft', postDate: d.postDate || todayManila(), coverImage: d.coverImage || '' };
    setForm(f);
    editorRef.current?.commands.setContent(d.html || '', { emitUpdate: false });
    setRestore(null);
    change({ ...f, html: d.html || '' });
  }
  function discardDraft() { clearDraft(draftId()); setRestore(null); }

  // ---- lifecycle guards -----------------------------------------------
  useEffect(() => {
    dead.current = false;
    locked.current = false;
    const onBefore = (e) => { if (!isClean() && !blocked.current) { e.preventDefault(); e.returnValue = ''; } };
    const onHide = () => { if (document.visibilityState === 'hidden' && !isClean()) flushRef.current(); };
    const onKey = (e) => {
      if (!isMod(e)) return;
      const k = e.key.toLowerCase();
      if (k === 'p') { e.preventDefault(); printNow(); }
      if (k === 's') { e.preventDefault(); flushRef.current(); }
    };
    window.addEventListener('beforeprint', fillPrint);
    window.addEventListener('beforeunload', onBefore);
    document.addEventListener('visibilitychange', onHide);
    document.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('beforeprint', fillPrint);
      window.removeEventListener('beforeunload', onBefore);
      document.removeEventListener('visibilitychange', onHide);
      document.removeEventListener('keydown', onKey, true);
      // Leaving the page (any link, even the tab bar) pushes pending edits out.
      // The request outlives the component; if it fails the local draft stays.
      clearTimeout(timer.current);
      dead.current = true;
      // The shared loop keeps draining after unmount (it no longer stops on dead);
      // only a lock (401) or a conflict stops it.
      if (!isClean() && !blocked.current && !locked.current) flushRef.current();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printNow, fillPrint]);

  async function goBack() {
    await flush();
    if (isClean()) { navigate('/blog'); return; }
    if (window.confirm('This post has changes that could not be saved. A recovery copy is kept in this tab until Ledger locks. Leave anyway?')) navigate('/blog');
  }

  async function remove() {
    clearTimeout(timer.current);
    blocked.current = true;
    await loop.current?.catch(() => {});
    try {
      if (idRef.current) await api.del(`/blog/${idRef.current}`);
      clearDraft(draftId());
      rev.current = savedRev.current;
      toast('Deleted');
      navigate('/blog');
    } catch (e) {
      blocked.current = false;
      setArmed(false);
      toast(e.message, 'error');
    }
  }

  async function resolveConflict(mode) {
    try {
      const { post } = await api.get(`/blog/${idRef.current}`);
      if (mode === 'overwrite') {
        versionRef.current = post.version;
        blocked.current = false;
        rev.current += 1; // force a save of what is on screen
        setSaveState('dirty');
        flush();
      } else {
        applyServer(post);
        rev.current = savedRev.current;
        blocked.current = false;
        clearDraft(idRef.current);
        setSaveState('clean');
      }
    } catch (e) { if (e.status !== 401) toast(e.message, 'error'); }
  }

  async function pickCover(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const startId = idRef.current;
    const startEd = editorRef.current;
    setUploading((n) => n + 1);
    try {
      const { url } = await uploadImage(file);
      if (dead.current || !editorRef.current || editorRef.current !== startEd || idRef.current !== startId) return;
      setForm((f) => ({ ...f, coverImage: url }));
      change({ coverImage: url });
    } catch (err) { if (err.message !== 'locked') toast(err.message, 'error'); } finally { setUploading((n) => n - 1); }
  }

  function applyLink(e) {
    e.preventDefault();
    const ed = editor;
    let url = linkUrl.trim();
    if (!url) ed.chain().focus().extendMarkRange('link').unsetLink().run();
    else {
      if (!/^(https?:|mailto:|tel:|\/|#)/i.test(url)) url = `https://${url}`;
      ed.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkOpen(false);
  }

  const ed = editor;
  const can = (fn) => (ed ? fn(ed.can().chain().focus()).run() : false);
  const state = uploading ? 'saving' : saveState;
  const stateText = uploading ? 'Uploading image…' : (saveState === 'error' && saveMsg ? saveMsg : STATUS_TEXT[saveState]);
  const previewSlug = form.slug || slugify(form.title);

  if (loadError) {
    return (
      <div className="card px-6 py-10 text-center" role="alert">
        <p className="font-display text-xl mb-3">{loadError}</p>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/blog')}>Back to Blog</button>
      </div>
    );
  }

  return (
    <div data-testid="blog-edit" className="blog-edit">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <button type="button" className="btn btn-ghost btn-sm" onClick={goBack} data-testid="blog-back">← Blog</button>
        <div className="flex items-center gap-2.5">
          <span className="save-state" data-state={state} data-testid="blog-save-state" role="status" aria-live="polite">
            <i aria-hidden="true" /> {stateText}
          </span>
          {['offline', 'error'].includes(saveState) && !uploading ? (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => flush()} data-testid="blog-retry">Retry</button>
          ) : null}
          <button type="button" className="btn btn-ghost btn-sm hidden sm:inline-flex" onClick={printNow} data-testid="blog-print">Print</button>
          {created ? <ConfirmButton armed={armed} setArmed={setArmed} onConfirm={remove} confirmLabel="Delete post" /> : null}
        </div>
      </div>

      {saveState === 'conflict' ? (
        <div className="card-flat px-4 py-3 mb-4 text-sm" role="alert" style={{ borderColor: 'var(--ember)' }} data-testid="blog-conflict">
          <p className="mb-2">This post was changed somewhere else since you opened it. Autosave is paused.</p>
          <div className="flex gap-2 flex-wrap">
            <button type="button" className="btn btn-danger btn-sm" onClick={() => resolveConflict('overwrite')}>Keep mine</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => resolveConflict('reload')}>Load theirs</button>
          </div>
        </div>
      ) : null}

      {restore ? (
        <div className="card-flat px-4 py-3 mb-4 text-sm" data-testid="blog-restore" style={{ borderColor: 'var(--gold)' }}>
          <p className="mb-2">Found unsaved edits in this tab.</p>
          <div className="flex gap-2 flex-wrap">
            <button type="button" className="btn btn-primary btn-sm" onClick={restoreDraft}>Restore them</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={discardDraft}>Discard</button>
          </div>
        </div>
      ) : null}

      {loading ? <Skeleton className="h-64 w-full" /> : null}

      <div hidden={loading}>
        <label className="sr-only" htmlFor="blog-title">Title</label>
        <input
          id="blog-title"
          className="blog-title"
          placeholder="Title"
          maxLength={200}
          value={form.title}
          onChange={setField('title')}
          data-testid="blog-title"
          autoComplete="off"
        />

        <div className="card-flat p-3 md:p-4 my-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="eyebrow block mb-1" htmlFor="blog-date">Date</label>
            <input id="blog-date" type="date" className="field" value={form.postDate} onChange={setField('postDate')} data-testid="blog-date" />
          </div>
          <div>
            <label className="eyebrow block mb-1" htmlFor="blog-status">Status</label>
            <select id="blog-status" className="field" value={form.status} onChange={setField('status')} data-testid="blog-status">
              <option value="draft">Draft</option>
              <option value="published">Published (private)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="eyebrow block mb-1" htmlFor="blog-slug">Slug</label>
            <input
              id="blog-slug"
              className="field font-mono !text-[14px]"
              maxLength={160}
              value={form.slug}
              placeholder={created ? '' : (previewSlug || 'auto from title')}
              onChange={(e) => {
                const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-{2,}/g, '-');
                setForm((f) => ({ ...f, slug: v }));
                change({ slug: v });
              }}
              data-testid="blog-slug"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="sm:col-span-2">
            <span className="eyebrow block mb-1">Cover image</span>
            <div className="flex items-center gap-3 flex-wrap">
              {form.coverImage ? (
                <img src={form.coverImage} alt="Cover" className="h-16 w-28 object-cover rounded-lg border border-line" data-testid="blog-cover-img" />
              ) : null}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => coverRef.current?.click()} data-testid="blog-cover-btn">
                {form.coverImage ? 'Replace' : 'Add cover'}
              </button>
              {form.coverImage ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setForm((f) => ({ ...f, coverImage: '' })); change({ coverImage: '' }); }}
                >
                  Remove
                </button>
              ) : null}
              <input ref={coverRef} type="file" accept={IMAGE_TYPES.join(',')} hidden onChange={pickCover} data-testid="blog-cover-input" />
            </div>
          </div>
          <p className="sm:col-span-2 text-xs text-mute">
            {form.status === 'published'
              ? 'Published only means finished. This post stays private and visible to you alone.'
              : 'Drafts are private too. Nothing here is on the public internet.'}
          </p>
        </div>

        <div className="editor-card">
          <div className="toolbar" role="toolbar" aria-label="Formatting" data-testid="blog-toolbar">
            <Tb label="Bold (Ctrl+B)" testid="tb-bold" active={ed?.isActive('bold')} onClick={() => ed.chain().focus().toggleBold().run()}><b>B</b></Tb>
            <Tb label="Italic (Ctrl+I)" testid="tb-italic" active={ed?.isActive('italic')} onClick={() => ed.chain().focus().toggleItalic().run()}><i className="font-serif">I</i></Tb>
            <Tb label="Underline (Ctrl+U)" testid="tb-underline" active={ed?.isActive('underline')} onClick={() => ed.chain().focus().toggleUnderline().run()}><u>U</u></Tb>
            <Tb label="Strikethrough" testid="tb-strike" active={ed?.isActive('strike')} onClick={() => ed.chain().focus().toggleStrike().run()}><s>S</s></Tb>
            <span className="tb-sep" aria-hidden="true" />
            {[1, 2, 3].map((l) => (
              <Tb key={l} label={`Heading ${l}`} testid={`tb-h${l}`} active={ed?.isActive('heading', { level: l })} onClick={() => ed.chain().focus().toggleHeading({ level: l }).run()}>H{l}</Tb>
            ))}
            <span className="tb-sep" aria-hidden="true" />
            <Tb label="Bulleted list" testid="tb-ul" active={ed?.isActive('bulletList')} onClick={() => ed.chain().focus().toggleBulletList().run()}>•</Tb>
            <Tb label="Numbered list" testid="tb-ol" active={ed?.isActive('orderedList')} onClick={() => ed.chain().focus().toggleOrderedList().run()}>1.</Tb>
            <Tb label="Quote" testid="tb-quote" active={ed?.isActive('blockquote')} onClick={() => ed.chain().focus().toggleBlockquote().run()}>“</Tb>
            <Tb label="Code" testid="tb-code" active={ed?.isActive('code')} onClick={() => ed.chain().focus().toggleCode().run()}>{'<>'}</Tb>
            <Tb label="Link (Ctrl+K)" testid="tb-link" active={ed?.isActive('link')} onClick={openLink}>↗</Tb>
            <span className="tb-sep" aria-hidden="true" />
            {['left', 'center', 'right'].map((a) => (
              <Tb key={a} label={`Align ${a}`} testid={`tb-align-${a}`} active={ed?.isActive({ textAlign: a })} onClick={() => ed.chain().focus().setTextAlign(a).run()}><AlignIcon kind={a} /></Tb>
            ))}
            <span className="tb-sep" aria-hidden="true" />
            <Tb label="Insert image" testid="tb-image" onClick={() => fileRef.current?.click()}>▣</Tb>
            <input
              ref={fileRef}
              type="file"
              accept={IMAGE_TYPES.join(',')}
              multiple
              hidden
              data-testid="blog-image-input"
              onChange={(e) => { const f = imageFiles(e.target.files); e.target.value = ''; if (f.length) insertImages(f); }}
            />
            <span className="tb-sep" aria-hidden="true" />
            <Tb label="Undo (Ctrl+Z)" testid="tb-undo" disabled={!can((c) => c.undo())} onClick={() => ed.chain().focus().undo().run()}>↶</Tb>
            <Tb label="Redo (Ctrl+Y)" testid="tb-redo" disabled={!can((c) => c.redo())} onClick={() => ed.chain().focus().redo().run()}>↷</Tb>
          </div>

          {linkOpen ? (
            <form className="flex gap-2 p-2 border-b border-line items-center" role="dialog" aria-label="Edit link" noValidate onSubmit={applyLink} data-testid="blog-link-form">
              <label htmlFor="blog-link-url" className="sr-only">Link address</label>
              <input
                id="blog-link-url"
                type="url"
                inputMode="url"
                className="field !min-h-[40px]"
                autoFocus
                placeholder="https://… (empty removes the link)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setLinkOpen(false); ed.commands.focus(); } }}
                data-testid="blog-link-input"
              />
              <button type="submit" className="btn btn-primary btn-sm" aria-label="Apply link">Apply</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setLinkOpen(false); ed.commands.focus(); }}>Cancel</button>
            </form>
          ) : null}

          <EditorContent editor={editor} className="editor-surface" onClick={(e) => { if (e.target === e.currentTarget) ed?.commands.focus('end'); }} />
        </div>
        <p className="text-xs text-mute mt-2">Images: JPEG, PNG, WEBP or GIF, up to 2 MB. Paste or drop them straight in.</p>
      </div>

      <div ref={printRef} className="blog-print blog-prose" aria-hidden="true" />
    </div>
  );
}
