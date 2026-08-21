import { useEffect, useState } from 'react';

import { Skeleton } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { dollar, fmtDate, peso } from '../lib/format.js';
import { useApp, useResource } from '../lib/store.jsx';

const FREQUENCIES = [
  ['biweekly', 'Every two weeks'],
  ['weekly', 'Every week'],
  ['semimonthly', '15th and end of month'],
  ['monthly', 'Once a month'],
];

export default function Settings() {
  const { theme, toggleTheme, setUnlocked, toast } = useApp();
  const { data, loading, reload } = useResource('/finance');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rateBusy, setRateBusy] = useState(false);

  useEffect(() => {
    if (data?.income && !form) {
      setForm({
        amountUsd: data.income.amountUsd,
        frequency: data.income.frequency,
        anchorPayday: data.income.anchorPayday,
      });
    }
  }, [data, form]);

  async function saveIncome(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/finance/income', {
        amountUsd: Number(form.amountUsd),
        frequency: form.frequency,
        anchorPayday: form.anchorPayday,
      });
      await reload();
      toast('Income updated');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function refreshRate() {
    setRateBusy(true);
    try {
      const r = await api.get('/finance/fx?refresh=1');
      await reload();
      toast(r.rate ? `₱${r.rate.toFixed(2)} to the dollar` : 'rate unavailable', r.rate ? 'ok' : 'error');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setRateBusy(false);
    }
  }

  async function lock() {
    try {
      await api.post('/auth/lock');
    } finally {
      // Drop the offline copy of her data too, or locking would hide the app
      // while leaving her figures and finances readable with the network off.
      navigator.serviceWorker?.controller?.postMessage({ type: 'ledger:purge' });
      setUnlocked(false);
    }
  }

  if (loading && !data) {
    return <div className="space-y-3"><Skeleton className="h-8 w-32" /><Skeleton className="h-56 w-full rounded-card" /></div>;
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5 enter">
      <h1 className="text-3xl">Settings</h1>

      {form ? (
        <form onSubmit={saveIncome} className="card p-5 space-y-4">
          <h2 className="text-xl">Income</h2>

          <div>
            <label className="label" htmlFor="s-amount">Take-home per paycheck (USD)</label>
            <input id="s-amount" className="field amount" inputMode="decimal" type="number" step="0.01"
              min="0" value={form.amountUsd} onChange={set('amountUsd')} required />
          </div>

          <div>
            <label className="label" htmlFor="s-freq">How often</label>
            <select id="s-freq" className="field" value={form.frequency} onChange={set('frequency')}>
              {FREQUENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="s-anchor">A payday to count from</label>
            <input id="s-anchor" className="field" type="date" value={form.anchorPayday}
              onChange={set('anchorPayday')} required />
            <p className="text-xs text-mute mt-1">
              Any real payday works; every other one is counted forwards and backwards from it.
            </p>
          </div>

          <div className="flex justify-between items-center gap-3 flex-wrap">
            <p className="text-xs text-mute">
              {peso(data.income.monthlyPhp)} a month · {data.income.perYear} paychecks a year
            </p>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      ) : null}

      <section className="card p-5">
        <h2 className="text-xl mb-1">Exchange rate</h2>
        <p className="text-sm text-mute mb-4">
          {data.fx.rate
            ? `₱${data.fx.rate.toFixed(4)} per dollar, ${data.fx.stale ? `stale from ${fmtDate(data.fx.day)}` : `fetched ${fmtDate(data.fx.day)}`}`
            : 'No rate available yet.'}
          {data.fx.source ? ` · ${data.fx.source}` : ''}
        </p>
        <button type="button" className="btn btn-ghost" onClick={refreshRate} disabled={rateBusy}>
          {rateBusy ? 'Fetching...' : 'Refresh now'}
        </button>
        <p className="text-xs text-mute mt-3">
          It refreshes itself once a day. This button is for when the peso does something dramatic.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-xl mb-4">Appearance</h2>
        <button type="button" className="btn btn-ghost" onClick={toggleTheme}>
          {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        </button>
      </section>

      <section className="card p-5">
        <h2 className="text-xl mb-1">What is in here</h2>
        <ul className="text-sm text-dim space-y-1 mt-3">
          <li>{data.expenseCount} recurring expenses</li>
          <li>{data.accounts.length} accounts, {peso(data.netWorth)} total</li>
          <li>{data.goals.length} goal{data.goals.length === 1 ? '' : 's'}</li>
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="text-xl mb-4">Lock</h2>
        <button type="button" className="btn btn-danger" onClick={lock}>Lock Ledger</button>
      </section>
    </div>
  );
}
