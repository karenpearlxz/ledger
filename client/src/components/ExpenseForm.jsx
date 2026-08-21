import { useState } from 'react';

import { ConfirmButton, Sheet } from './ui.jsx';

export const CATEGORIES = ['Housing', 'Transport', 'Utilities', 'Food', 'Family',
  'Education', 'Debt', 'Personal', 'Savings', 'Other'];

export const thisMonth = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit',
}).format(new Date()).slice(0, 7);

export const shiftMonth = (ym, n) => {
  const [y, m] = ym.split('-').map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
};

export const blank = {
  name: '', amount: '', category: 'Other', dueDay: '', isRecurring: true,
  frequency: 'monthly', notes: '', endDate: '',
};

/** `amount` is one occurrence, so the label has to say which occurrence. */
export const FREQUENCIES = [
  { value: 'weekly', label: 'Every week', per: 'a week', perYear: 52 },
  { value: 'biweekly', label: 'Every two weeks', per: 'two weeks', perYear: 26 },
  { value: 'monthly', label: 'Every month', per: 'a month', perYear: 12 },
  { value: 'quarterly', label: 'Every 3 months', per: '3 months', perYear: 4 },
  { value: 'yearly', label: 'Every year', per: 'a year', perYear: 1 },
  { value: 'once', label: 'Just once', per: 'once', perYear: 0 },
];

/** Averaged over the year for short cadences; long ones land whole. */
export const monthlyEquivalent = (amount, frequency) => {
  const n = Number(amount) || 0;
  if (frequency === 'weekly') return Math.round((n * 52 / 12) * 100) / 100;
  if (frequency === 'biweekly') return Math.round((n * 26 / 12) * 100) / 100;
  return Math.round(n * 100) / 100;
};

export function ExpenseForm({ initial, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // One control for cadence. "Just once" is not a frequency, it is the absence
  // of recurrence, but to her it belongs in the same list.
  const freq = form.isRecurring === false ? 'once' : (form.frequency || 'monthly');
  const spread = freq === 'weekly' || freq === 'biweekly';
  const monthly = monthlyEquivalent(form.amount, freq);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    const ok = await onSave({
      name: form.name.trim(),
      amount: Number(form.amount),
      category: form.category,
      dueDay: spread || form.dueDay === '' ? null : Number(form.dueDay),
      isRecurring: freq !== 'once',
      frequency: freq === 'once' ? 'monthly' : freq,
      notes: form.notes,
      endDate: form.endDate || null,
    });
    if (!ok) setBusy(false);
  }

  return (
    <Sheet
      title={initial.id ? 'Edit expense' : 'New expense'}
      subtitle={initial.id ? initial.name : 'Recurring bills come back every month on their own.'}
      onClose={onClose}
      footer={(
        <div className="flex gap-2 justify-between items-center flex-wrap w-full">
          {initial.id
            ? <ConfirmButton label="Delete" onConfirm={onDelete} armed={armed} setArmed={setArmed} />
            : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            {/* Outside the <form>, so it needs form= to submit it. */}
            <button type="submit" form="expense-form" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    >
      <form id="expense-form" onSubmit={save} className="space-y-3">
        <div>
          <label className="label" htmlFor="ex-name">Name</label>
          <input id="ex-name" className="field" value={form.name} onChange={set('name')} required maxLength={80} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="ex-amount">Amount (PHP)</label>
            <input id="ex-amount" className="field amount" inputMode="decimal" type="number" step="0.01"
              min="0" value={form.amount} onChange={set('amount')} required />
          </div>
          <div>
            <label className="label" htmlFor="ex-freq">Repeats</label>
            <select
              id="ex-freq" className="field" value={freq}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({
                  ...f,
                  isRecurring: v !== 'once',
                  frequency: v === 'once' ? 'monthly' : v,
                  dueDay: (v === 'weekly' || v === 'biweekly') ? '' : f.dueDay,
                }));
              }}
            >
              {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {spread ? null : (
            <div>
              <label className="label" htmlFor="ex-day">Due day</label>
              <input id="ex-day" className="field amount" inputMode="numeric" type="number" min="1" max="31"
                value={form.dueDay ?? ''} onChange={set('dueDay')} placeholder="spread" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="ex-cat">Category</label>
            <select id="ex-cat" className="field" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ex-end">Ends on</label>
            <input id="ex-end" className="field" type="date" value={form.endDate || ''} onChange={set('endDate')} />
          </div>
        </div>

        {/* The one number that stops a fortnightly cost being read as monthly. */}
        <p className="text-xs text-mute" data-testid="freq-hint">
          {spread
            ? `Spread across the month · about ₱${monthly.toLocaleString('en-PH', { maximumFractionDigits: 0 })} a month`
            : freq === 'once'
              ? 'Counts in this month only.'
              : freq === 'monthly'
                ? 'Leave the day blank to spread it across the month.'
                : `Lands whole, every ${FREQUENCIES.find((f) => f.value === freq).per}.`}
        </p>

        <div>
          <label className="label" htmlFor="ex-notes">Notes</label>
          <input id="ex-notes" className="field" value={form.notes} onChange={set('notes')} maxLength={500} />
        </div>
      </form>
    </Sheet>
  );
}
