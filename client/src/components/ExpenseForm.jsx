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
  name: '', amount: '', category: 'Other', dueDay: '', isRecurring: true, notes: '', endDate: '',
};

export function ExpenseForm({ initial, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    const ok = await onSave({
      name: form.name.trim(),
      amount: Number(form.amount),
      category: form.category,
      dueDay: form.dueDay === '' ? null : Number(form.dueDay),
      isRecurring: form.isRecurring,
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
    >
      <form onSubmit={save} className="space-y-4">
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
            <label className="label" htmlFor="ex-day">Due day</label>
            <input id="ex-day" className="field amount" inputMode="numeric" type="number" min="1" max="31"
              value={form.dueDay ?? ''} onChange={set('dueDay')} placeholder="spread" />
          </div>
        </div>
        <p className="text-xs text-mute -mt-2">
          Leave the day blank for anything spread across the month, like groceries or gas.
        </p>

        <div>
          <label className="label" htmlFor="ex-cat">Category</label>
          <select id="ex-cat" className="field" value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <label className="flex items-center gap-3 text-sm min-h-[44px]">
          <input type="checkbox" className="w-5 h-5 accent-[var(--teal)]" checked={form.isRecurring}
            onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))} />
          Repeats every month
        </label>

        <div>
          <label className="label" htmlFor="ex-end">Ends on (optional)</label>
          <input id="ex-end" className="field" type="date" value={form.endDate || ''} onChange={set('endDate')} />
          <p className="text-xs text-mute mt-1">For instalments with a last payment, like the TV in April 2027.</p>
        </div>

        <div>
          <label className="label" htmlFor="ex-notes">Notes</label>
          <input id="ex-notes" className="field" value={form.notes} onChange={set('notes')} maxLength={500} />
        </div>

        <div className="flex gap-2 justify-between items-center flex-wrap pt-1">
          {initial.id
            ? <ConfirmButton label="Delete" onConfirm={onDelete} armed={armed} setArmed={setArmed} />
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
