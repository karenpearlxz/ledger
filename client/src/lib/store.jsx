import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { api, onLocked } from './api.js';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const THEME_KEY = 'ledger.theme';

function initialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let toastId = 0;

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  const [unlocked, setUnlocked] = useState(null); // null = still asking
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    // Keep the iOS status bar and Android chrome in step with the theme. A
    // fixed cream theme-color leaves a pale band above a dark app.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const paper = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
      if (paper) meta.setAttribute('content', paper);
    }
  }, [theme]);

  // A dropped session must also drop the cached copies, or the lock screen
  // would be sitting on top of her finances still held in memory.
  useEffect(() => onLocked(() => { clearCache(); setUnlocked(false); }), []);

  useEffect(() => {
    api.get('/auth/me')
      .then((r) => setUnlocked(Boolean(r.unlocked)))
      .catch(() => setUnlocked(false));
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((message, tone = 'ok') => {
    const id = ++toastId;
    setToasts((list) => [...list.slice(-2), { id, message, tone }]);
    timers.current.set(id, setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 3500));
    return id;
  }, [dismiss]);

  // Clearing timers on unmount stops a late toast from setting state on a
  // dead tree during a hot reload or a lock.
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.clear(); }, []);

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    unlocked,
    setUnlocked,
    toasts,
    toast,
    dismiss,
  }), [theme, unlocked, toasts, toast, dismiss]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Stale-while-revalidate cache, keyed by request path.
 *
 * Switching tabs used to refetch from scratch and show a skeleton every time,
 * which made a five-screen app feel slow for no reason: the data she is about
 * to see is almost always the data she just saw. Now the last response paints
 * immediately and the network confirms it behind her.
 *
 * Held in memory only. Locking clears it, or the next person to open the app
 * offline would read her finances straight out of the cache.
 */
const cache = new Map();

export const clearCache = () => cache.clear();

// Global refresh triggers - components register their reload functions here
const refreshCallbacks = new Set();
export const registerRefresh = (fn) => { refreshCallbacks.add(fn); return () => refreshCallbacks.delete(fn); };
export const refreshAll = async () => {
  clearCache();
  await Promise.all([...refreshCallbacks].map(fn => fn()));
};

/** Drop cached entries whose path starts with `prefix`. */
export function invalidate(prefix) {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/**
 * Small fetch helper with a stable `reload`. `loading` is true only when there
 * is nothing at all to show; a cached copy paints instantly and is refreshed in
 * the background. A cost tracker flashing ₱0 reads as "you have nothing", which
 * is worse than a number a few seconds old.
 */
export function useResource(path, deps = []) {
  const [data, setData] = useState(() => (cache.has(path) ? cache.get(path) : null));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(() => !cache.has(path));
  const alive = useRef(true);
  // Responses can land out of order. Switching month fires a new request while
  // the previous one is still in flight, and the slower old response would
  // otherwise overwrite the newer data with the month she just left.
  const seq = useRef(0);

  useEffect(() => () => { alive.current = false; }, []);

  const reload = useCallback(async () => {
    const ticket = ++seq.current;
    try {
      const result = await api.get(path);
      cache.set(path, result);
      if (!alive.current || ticket !== seq.current) return result;
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      if (alive.current && ticket === seq.current && err.status !== 401) setError(err.message);
      return null;
    } finally {
      if (alive.current && ticket === seq.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    // Paint whatever we already hold for this exact path, then revalidate.
    if (cache.has(path)) {
      setData(cache.get(path));
      setLoading(false);
    } else {
      setData(null);
      setLoading(true);
    }
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps.length ? deps : [path]);

  // An optimistic update has to reach the cache too, or navigating away and
  // back would resurrect the pre-update copy from memory.
  const setDataCached = useCallback((next) => {
    setData((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      if (value !== null && value !== undefined) cache.set(path, value);
      return value;
    });
  }, [path]);

  return { data, error, loading, reload, setData: setDataCached };
}
