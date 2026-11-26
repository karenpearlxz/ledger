import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { PlusIcon } from '../components/icons.jsx';
import { Empty, Skeleton } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { fmtLongDate } from '../lib/format.js';

export default function Blog() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const d = await api.get('/blog');
      setPosts(d.posts || []);
      setError('');
    } catch (e) { if (e.status !== 401) setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div data-testid="blog-list">
      <div className="flex items-end justify-between gap-3 mb-2">
        <div>
          <p className="eyebrow mb-1.5">private</p>
          <h1 className="font-display text-4xl md:text-5xl leading-none">Blog</h1>
        </div>
        <button type="button" className="btn btn-primary" data-testid="blog-new" onClick={() => navigate('/blog/new')}>
          <PlusIcon width={16} height={16} /> New post
        </button>
      </div>
      <p className="text-sm text-mute mb-6 max-w-xl">
        Drafts and posts live here, just for you. Marking one “published” does not put it on the internet.
      </p>

      {error ? (
        <div className="card-flat px-4 py-3 text-sm mb-4" role="alert" style={{ borderColor: 'var(--ember)' }}>
          {error} <button type="button" className="underline ml-2" onClick={load}>Retry</button>
        </div>
      ) : null}

      {posts === null && !error ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : null}

      {posts && posts.length === 0 ? (
        <Empty
          title="Nothing written yet"
          hint="Start a post. It saves itself as you type."
          action={<button type="button" className="btn btn-primary" onClick={() => navigate('/blog/new')}>Write the first one</button>}
        />
      ) : null}

      {posts && posts.length ? (
        <ul className="space-y-3 list-none p-0 m-0">
          {posts.map((p) => (
            <li key={p.id}>
              <Link to={`/blog/${p.id}`} className="card block overflow-hidden no-underline text-ink" data-testid="blog-row">
                <div className="flex">
                  {p.coverImage ? (
                    <img src={p.coverImage} alt="" loading="lazy" className="w-24 md:w-36 object-cover shrink-0 border-r border-line" />
                  ) : null}
                  <div className="p-4 md:p-5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`chip ${p.status === 'published' ? 'teal' : 'gold'}`}>
                        {p.status === 'published' ? 'Published · private' : 'Draft'}
                      </span>
                      <span className="eyebrow">{fmtLongDate(p.postDate)}</span>
                    </div>
                    <h2 className="font-display text-2xl leading-tight break-words">{p.title || 'Untitled'}</h2>
                    {p.excerpt ? <p className="text-sm text-dim mt-1 line-clamp-2 break-words">{p.excerpt}</p> : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
