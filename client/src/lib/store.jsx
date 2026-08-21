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
  }, [theme]);

  useEffect(() => onLocked(() => setUnlocked(false)), []);

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
 * Small fetch helper with a stable `reload`. `loading` stays true only on the
 * FIRST load so a refresh does not blank the screen; a cost tracker flashing
 * ₱0 reads as "you have nothing", which is worse than a stale number.
 */
export function useResource(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps.length ? deps : [path]);

  return { data, error, loading, reload, setData };
}
