import { useState } from 'react';

import { PlusIcon } from '../components/icons.jsx';
import { Bar, ConfirmButton, Empty, Sheet, Skeleton } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { dollar, fmtDate, fmtMonthShort, peso } from '../lib/format.js';
import { useApp, useResource } from '../lib/store.jsx';

function BalanceSheet({ account, onClose, onSaved }) {
  const [amount, setAmount] = useState(account.balance ?? '');
  const [busy, setBusy] = useState(false);
  const { toast } = useApp();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put(`/accounts/${account.id}/balance`, { amount: Number(amount) });
      await onSaved();
      toast(`${account.name} updated`);
      onClose();
    } catch (err) {
      toast(err.message, 'error');
      setBusy(false);
    }
  }

  return (
    <Sheet
      title={account.name}
      subtitle={account.balanceAsOf ? `Last set ${fmtDate(account.balanceAsOf)}` : 'No balance recorded yet'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="bal">Balance today ({account.currency})</label>
          <input
            id="bal" className="field amount text-xl" inputMode="decimal" type="number" step="0.01"
            value={amount} onChange={(e) => setAmount(e.target.value)} required
          />
          <p className="text-xs text-mute mt-1">
            Each save is a snapshot, so the net worth line builds itself over time.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </Sheet>
  );
}

function GoalSheet({ goal, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useApp();
  const { data, reload } = useResource(`/goals/${goal.id}/contributions`, [goal.id]);
  const [armed, setArmed] = useState(null);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/goals/${goal.id}/contributions`, { amount: Number(amount), note });
      setAmount('');
      setNote('');
      await Promise.all([reload(), onSaved()]);
      toast('Added to the pot');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      await api.del(`/goals/contributions/${id}`);
      setArmed(null);
      await Promise.all([reload(), onSaved()]);
      toast('Removed');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <Sheet title={goal.name} subtitle={`${peso(goal.saved)} of ${peso(goal.targetAmount)}`} onClose={onClose}>
      <Bar percent={goal.percent} color={goal.color} height={12} />

      <form onSubmit={add} className="mt-5 space-y-3">
        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <div>
            <label className="label" htmlFor="contrib">Add (a minus sign takes money back out)</label>
            <input id="contrib" className="field amount" inputMode="decimal" type="number" step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy || !amount}>Add</button>
        </div>
        <input className="field" placeholder="note, optional" value={note}
          onChange={(e) => setNote(e.target.value)} maxLength={200} />
      </form>

      <h3 className="text-lg mt-6 mb-2">History</h3>
      {data?.contributions?.length ? (
        <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
          {data.contributions.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="amount text-sm" style={{ color: c.amount < 0 ? 'var(--ember)' : 'var(--ink)' }}>
                  {peso(c.amount)}
                </p>
                <p className="text-xs text-mute truncate">{fmtDate(c.onDate)}{c.note ? ` · ${c.note}` : ''}</p>
              </div>
              <ConfirmButton
                label="Remove" onConfirm={() => remove(c.id)}
                armed={armed === c.id} setArmed={(v) => setArmed(v ? c.id : null)}
              />
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-mute">Nothing put in yet.</p>}
    </Sheet>
  );
}

export default function Money() {
  const { data, loading, error, reload } = useResource('/finance');
  const insights = useResource('/transactions/insights?months=6');
  const [balancing, setBalancing] = useState(null);
  const [goaling, setGoaling] = useState(null);

  if (error) return <div className="card p-6" role="alert"><p className="text-sm">{error}</p></div>;

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  }

  const { accounts, netWorth, goals, income, fx } = data;
  const cats = insights.data?.byCategory ?? [];
  const catTotal = cats.reduce((a, c) => a + c.total, 0);

  return (
    <div className="space-y-5 enter">
      <section className="card p-6">
        <p className="eyebrow mb-1">net worth</p>
        <p className="font-display text-[2.5rem] leading-none">{peso(netWorth)}</p>
        <p className="text-sm text-mute mt-1.5">
          across {accounts.length} account{accounts.length === 1 ? '' : 's'}
        </p>

        <hr className="rule my-5" />

        <ul className="space-y-1">
          {accounts.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setBalancing(a)}
                className="w-full flex items-center gap-3 py-2.5 text-left"
                aria-label={`Update ${a.name} balance`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.color }} aria-hidden="true" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm truncate">{a.name}</span>
                  <span className="block text-xs text-mute truncate">
                    {a.balanceAsOf ? `as of ${fmtDate(a.balanceAsOf)}` : 'tap to set'}
                    {a.note ? ` · ${a.note}` : ''}
                  </span>
                </span>
                <span className="amount text-sm shrink-0">
                  {a.balance === null ? <span className="text-mute">—</span> : peso(a.balancePhp)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="text-xl mb-1">Income</h2>
        <p className="text-sm text-mute mb-4">
          {dollar(income.amountUsd)} every {income.frequency === 'biweekly' ? 'two weeks' : income.frequency}
          {fx.rate ? ` at ₱${fx.rate.toFixed(2)}` : ''}
        </p>
        <div className="flex gap-6 flex-wrap">
          <div>
            <p className="eyebrow mb-1">per month</p>
            <p className="amount text-lg">{peso(income.monthlyPhp)}</p>
          </div>
          <div>
            <p className="eyebrow mb-1">per year</p>
            <p className="amount text-lg">{dollar(income.amountUsd * income.perYear)}</p>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl mb-4">Goals</h2>
        {goals.length ? (
          <div className="space-y-5">
            {goals.map((g) => (
              <button key={g.id} type="button" onClick={() => setGoaling(g)} className="w-full text-left">
                <div className="flex justify-between items-baseline gap-3 mb-1.5">
                  <span className="text-sm">{g.name}</span>
                  <span className="amount text-xs text-mute">{peso(g.saved)} / {peso(g.targetAmount)}</span>
                </div>
                <Bar percent={g.percent} color={g.color} />
                <p className="text-xs text-mute mt-1.5">
                  {peso(Math.max(0, g.targetAmount - g.saved))} to go
                  {g.note ? ` · ${g.note}` : ''}
                </p>
              </button>
            ))}
          </div>
        ) : <p className="text-sm text-mute">No goals yet.</p>}
      </section>

      {cats.length ? (
        <section className="card p-5">
          <h2 className="text-xl mb-1">Where it goes</h2>
          <p className="text-xs text-mute mb-4">Logged spending, last 6 months.</p>
          <div className="flex h-3 rounded-pill overflow-hidden mb-4" aria-hidden="true">
            {cats.map((c) => (
              <div key={c.category} style={{ width: `${(c.total / catTotal) * 100}%`, background: c.color }} />
            ))}
          </div>
          <ul className="space-y-2">
            {cats.map((c) => (
              <li key={c.category} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} aria-hidden="true" />
                <span className="text-sm flex-1">{c.category}</span>
                <span className="amount text-sm">{peso(c.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Empty
          title="No logged spending yet"
          hint="Bills you tick off live under Bills. This chart fills in once day-to-day transactions are added."
        />
      )}

      {balancing ? (
        <BalanceSheet account={balancing} onClose={() => setBalancing(null)} onSaved={reload} />
      ) : null}
      {goaling ? (
        <GoalSheet
          goal={data.goals.find((g) => g.id === goaling.id) ?? goaling}
          onClose={() => setGoaling(null)}
          onSaved={reload}
        />
      ) : null}
    </div>
  );
}
