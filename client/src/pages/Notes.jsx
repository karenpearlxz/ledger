import { useMemo, useState } from 'react';

import { PlusIcon } from '../components/icons.jsx';
import { ConfirmButton, Empty, Sheet, Skeleton } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { fmtDayName, fmtLongDate } from '../lib/format.js';
import { useApp, useResource } from '../lib/store.jsx';

const TABS = [
  { key: 'journal', label: 'Journal', path: '/content/journal', accent: 'var(--plum)' },
  { key: 'work', label: 'Work log', path: '/content/work', accent: 'var(--ember)' },
  { key: 'poems', label: 'Verses', path: '/content/poems', accent: 'var(--rose)' },
];

const todayIso = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

function EntrySheet({ tab, entry, onClose, onSaved }) {
  const isPoem = tab.key === 'poems';
  const [form, setForm] = useState(() => (isPoem
    ? { title: entry?.title ?? '', body: entry?.body ?? '', writtenOn: entry?.writtenOn ?? '' }
    : { entryDate: entry?.entryDate ?? todayIso(), title: entry?.title ?? '', body: entry?.body ?? '' }));
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const { toast } = useApp();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (entry?.id) await api.patch(`${tab.path}/${entry.id}`, form);
      else await api.post(tab.path, form);
      await onSaved();
      toast('Saved');
      onClose();
    } catch (err) {
      toast(err.message, 'error');
      setBusy(false);
    }
  }

  async function remove() {
    try {
      await api.del(`${tab.path}/${entry.id}`);
      await onSaved();
      toast('Deleted');
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <Sheet title={entry?.id ? 'Edit' : `New ${tab.label.toLowerCase()}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {isPoem ? (
          <>
            <div>
              <label className="label" htmlFor="n-title">Title</label>
              <input id="n-title" className="field" value={form.title} onChange={set('title')} required maxLength={120} />
            </div>
            <div>
              <label className="label" htmlFor="n-when">When</label>
              <input id="n-when" className="field" value={form.writtenOn} onChange={set('writtenOn')}
                placeholder="collected works" maxLength={60} />
            </div>
          </>
        ) : (
          <div>
            <label className="label" htmlFor="n-date">Date</label>
            <input id="n-date" className="field" type="date" value={form.entryDate} onChange={set('entryDate')} required />
          </div>
        )}

        <div>
          <label className="label" htmlFor="n-body">{isPoem ? 'The poem' : 'What happened'}</label>
          <textarea
            id="n-body"
            className={`field ${isPoem ? 'poem-body !text-base' : ''}`}
            style={{ minHeight: 200 }}
            value={form.body}
            onChange={set('body')}
            required
          />
        </div>

        <div className="flex gap-2 justify-between items-center flex-wrap">
          {entry?.id
            ? <ConfirmButton label="Delete" onConfirm={remove} armed={armed} setArmed={setArmed} />
            : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </form>
    </Sheet>
  );
}

export default function Notes() {
  const [tabKey, setTabKey] = useState('journal');
  const [editing, setEditing] = useState(null);
  const tab = TABS.find((t) => t.key === tabKey);
  const { data, loading, error, reload } = useResource(tab.path, [tab.path]);

  const items = useMemo(() => (
    tabKey === 'poems' ? (data?.poems ?? []) : (data?.entries ?? [])
  ), [data, tabKey]);

  return (
    <div className="space-y-5 enter">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl">Notes</h1>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing({})}>
          <PlusIcon width={15} height={15} /> New
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Note kinds">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === tabKey}
            onClick={() => setTabKey(t.key)}
            className="chip !min-h-[36px] !px-4"
            style={t.key === tabKey
              ? { color: t.accent, borderColor: t.accent, background: `color-mix(in srgb, ${t.accent} 12%, transparent)` }
              : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <div className="card p-5" role="alert"><p className="text-sm">{error}</p></div> : null}

      {loading && !data ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-card" />)}
        </div>
      ) : items.length ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setEditing(item)}
                className="card w-full text-left p-5"
                style={{ borderLeft: `3px solid ${tab.accent}` }}
              >
                {tabKey === 'poems' ? (
                  <>
                    <div className="flex justify-between items-baseline gap-3 flex-wrap mb-2">
                      <h2 className="font-display italic text-2xl leading-tight">{item.title}</h2>
                      <span className="eyebrow">{item.writtenOn}</span>
                    </div>
                    <p className="poem-body">{item.body}</p>
                  </>
                ) : (
                  <>
                    <p className="eyebrow mb-2">
                      {fmtLongDate(item.entryDate)} · {fmtDayName(item.entryDate)}
                    </p>
                    {item.title ? <h2 className="text-xl mb-1">{item.title}</h2> : null}
                    <p className="text-[0.94rem] leading-relaxed whitespace-pre-wrap">{item.body}</p>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          title={`No ${tab.label.toLowerCase()} yet`}
          hint="Write one and it stays here."
          action={<button type="button" className="btn btn-primary" onClick={() => setEditing({})}>Write one</button>}
        />
      )}

      {editing ? (
        <EntrySheet
          tab={tab}
          entry={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      ) : null}
    </div>
  );
}
