import { useState } from 'react';

import { api } from '../lib/api.js';
import { useApp } from '../lib/store.jsx';

export default function Lock() {
  const { setUnlocked, theme, toggleTheme } = useApp();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/unlock', { passcode });
      setUnlocked(true);
    } catch (err) {
      setError(err.message);
      setPasscode('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center shell relative z-[1]">
      <div className="w-full max-w-sm enter">
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl leading-none">Ledger</h1>
          <p className="eyebrow mt-3">money, work, and everything written down</p>
        </div>

        <form onSubmit={submit} className="card p-6">
          <label className="label" htmlFor="passcode">Passcode</label>
          <input
            id="passcode"
            className="field"
            type="password"
            inputMode="text"
            autoComplete="current-password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="••••••••"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          {error ? (
            <p className="text-sm mt-3" style={{ color: 'var(--ember)' }} role="alert">{error}</p>
          ) : null}
          <button type="submit" className="btn btn-primary w-full mt-4" disabled={busy || !passcode}>
            {busy ? 'Checking…' : 'Unlock'}
          </button>
        </form>

        <button type="button" onClick={toggleTheme} className="btn btn-ghost btn-sm w-full mt-4">
          {theme === 'dark' ? 'Light' : 'Dark'} mode
        </button>
      </div>
    </div>
  );
}
