import { useEffect, useMemo, useState } from 'react';

import { ChevronIcon, SearchIcon } from '../components/icons.jsx';
import { Empty, Skeleton } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useApp, useResource } from '../lib/store.jsx';

/**
 * A figure's body is 8-48KB of formatted HTML lifted out of the old dashboard.
 * Loading all 48 up front is several megabytes, so the list carries only the
 * header fields and the essay is fetched when a card is opened.
 */
function FigureBody({ slug }) {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);
  const { toast } = useApp();

  useEffect(() => {
    let alive = true;
    api.get(`/content/figures/${slug}`)
      .then((r) => { if (alive) setHtml(r.figure.body); })
      .catch((err) => {
        if (!alive || err.status === 401) return;
        setError(err.message);
        toast(err.message, 'error');
      });
    return () => { alive = false; };
  }, [slug, toast]);

  if (error) return <p className="text-sm" style={{ color: 'var(--ember)' }}>{error}</p>;
  if (html === null) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-9/12" />
      </div>
    );
  }
  // Stripped of scripts, handlers and javascript: URLs at import time; see
  // scripts/import-dashboard.py.
  // eslint-disable-next-line react/no-danger
  return <div className="prose-import" dangerouslySetInnerHTML={{ __html: html }} />;
}

function FigureCard({ f, open, onToggle }) {
  return (
    <li className="card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full text-left p-5 flex items-start gap-3"
      >
        <span className="flex-1 min-w-0">
          <span className="block font-display text-xl leading-tight">{f.name}</span>
          <span className="block text-[0.8rem] text-mute mt-1.5 leading-relaxed">
            {open ? f.epithet : `${f.epithet.slice(0, 150)}${f.epithet.length > 150 ? '…' : ''}`}
          </span>
        </span>
        <span className="flex items-center gap-2 shrink-0 pt-0.5">
          {f.chipDate ? <span className="chip plum hidden sm:inline-flex">{f.chipDate}</span> : null}
          <ChevronIcon
            width={17} height={17}
            style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'var(--ink-mute)' }}
          />
        </span>
      </button>
      {open ? (
        <div className="px-5 pb-6 -mt-1">
          <hr className="rule mb-5" />
          <FigureBody slug={f.slug} />
        </div>
      ) : null}
    </li>
  );
}

export default function Figures() {
  const { data, loading, error } = useResource('/content/figures');
  const [openSlug, setOpenSlug] = useState(null);
  const [q, setQ] = useState('');

  const figures = data?.figures ?? [];
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return figures;
    return figures.filter((f) => `${f.name} ${f.epithet}`.toLowerCase().includes(needle));
  }, [figures, q]);

  return (
    <div className="space-y-5 enter">
      <div>
        <p className="eyebrow" style={{ color: 'var(--plum)' }}>daily wisdom</p>
        <h1 className="text-3xl mt-1">Classic <em className="italic">figures</em>.</h1>
        <p className="text-sm text-mute mt-1">
          Mythology, philosophy, history, literature. {figures.length} of them, newest first.
        </p>
      </div>

      <div className="relative">
        <SearchIcon
          width={17} height={17}
          style={{ position: 'absolute', left: 14, top: 15, color: 'var(--ink-mute)' }}
        />
        <input
          className="field !pl-11"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search names"
          aria-label="Search figures"
        />
      </div>

      {error ? <div className="card p-5" role="alert"><p className="text-sm">{error}</p></div> : null}

      {loading && !data ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-card" />)}
        </div>
      ) : shown.length ? (
        <ul className="space-y-3">
          {shown.map((f) => (
            <FigureCard
              key={f.slug}
              f={f}
              open={openSlug === f.slug}
              onToggle={() => setOpenSlug(openSlug === f.slug ? null : f.slug)}
            />
          ))}
        </ul>
      ) : (
        <Empty title="Nobody by that name" hint="Try part of a name instead." />
      )}
    </div>
  );
}
