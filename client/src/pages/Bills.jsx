import { useState } from 'react';

import BillCalendar from '../components/BillCalendar.jsx';
import { ExpenseForm, blank, shiftMonth, thisMonth } from '../components/ExpenseForm.jsx';
import { CheckIcon, ChevronIcon, PlusIcon } from '../components/icons.jsx';
import { Empty, Skeleton } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { fmtDate, fmtMonth, peso, relativeDay } from '../lib/format.js';
import { useApp, useResource } from '../lib/store.jsx';

function BillRow({ b, today, onToggle, onEdit }) {
  const paid = Boolean(b.paidOn);
  return (
    <li className="flex items-center gap-3 py-3">
      <button
        type="button"
        onClick={() => onToggle(b)}
        aria-pressed={paid}
        aria-label={paid ? `Mark ${b.name} unpaid` : `Mark ${b.name} paid`}
        className="shrink-0 grid place-items-center rounded-full border transition-colors"
        style={{
          width: 34,
          height: 34,
          borderColor: paid ? 'var(--teal)' : 'var(--line)',
          background: paid ? 'var(--teal)' : 'transparent',
          color: paid ? 'var(--bg-2)' : 'var(--ink-mute)',
        }}
      >
        <CheckIcon width={17} height={17} style={{ opacity: paid ? 1 : 0.35 }} />
      </button>

      <button
        type="button"
        onClick={() => onEdit(b)}
        className="flex-1 min-w-0 text-left py-1"
        aria-label={`Edit ${b.name}`}
      >
        <p className={`text-sm truncate ${paid ? 'line-through opacity-55' : ''}`}>{b.name}</p>
        <p className="text-xs" style={{ color: b.overdue ? 'var(--ember)' : 'var(--ink-mute)' }}>
          {b.spread
            ? 'spread across the month'
            : `${fmtDate(b.dueDate)} · ${b.overdue ? 'overdue' : relativeDay(b.dueDate, today)}`}
        </p>
      </button>

      <span className={`amount text-sm shrink-0 ${paid ? 'opacity-55' : ''}`}>{peso(b.amountPhp)}</span>
    </li>
  );
}

export default function Bills() {
  const { toast } = useApp();
  const [month, setMonth] = useState(thisMonth);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('list');
  const { data, loading, error, reload } = useResource(`/finance?month=${month}`, [month]);

  async function toggle(b) {
    const paidOn = b.paidOn ? null : (data?.today ?? null);
    try {
      await api.patch(`/expenses/payments/${b.id}`, { paidOn });
      await reload();
      toast(paidOn ? `${b.name} marked paid` : `${b.name} back to unpaid`);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function save(body) {
    try {
      const id = editing?.expenseId || editing?.id;
      if (id) await api.patch(`/expenses/${id}`, body);
      else await api.post('/expenses', body);
      await reload();
      setEditing(null);
      toast('Saved');
      return true;
    } catch (err) {
      toast(err.message, 'error');
      return false;
    }
  }

  async function remove() {
    try {
      await api.del(`/expenses/${editing.expenseId || editing.id}`);
      await reload();
      setEditing(null);
      toast('Expense removed');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const bills = data?.bills ?? [];
  const dated = bills.filter((b) => !b.spread);
  const spread = bills.filter((b) => b.spread);
  const unpaidTotal = bills.filter((b) => !b.paidOn).reduce((a, b) => a + b.amountPhp, 0);

  return (
    <div className="space-y-5 enter">
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="btn btn-ghost btn-sm !px-3"
          onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
          <ChevronIcon width={16} height={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div className="text-center">
          <h1 className="text-2xl leading-none">{fmtMonth(month)}</h1>
          <div className="inline-flex gap-1 mt-2" role="tablist" aria-label="View">
            {['list', 'calendar'].map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className="chip !min-h-[30px] !px-3 capitalize"
                style={view === v
                  ? { color: 'var(--teal)', borderColor: 'var(--teal)', background: 'color-mix(in srgb, var(--teal) 12%, transparent)' }
                  : undefined}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm !px-3"
          onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
          <ChevronIcon width={16} height={16} />
        </button>
      </div>

      {error ? <div className="card p-5" role="alert"><p className="text-sm">{error}</p></div> : null}

      {loading && !data ? (
        <div className="card p-5 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
      ) : (
        <>
          <div className="card p-5 flex justify-between items-baseline gap-3">
            <div>
              <p className="eyebrow mb-1">still to pay</p>
              <p className="font-display text-3xl leading-none">{peso(unpaidTotal)}</p>
            </div>
            <div className="text-right">
              <p className="eyebrow mb-1">month total</p>
              <p className="amount text-lg">{peso(data?.totals.monthlyFixed)}</p>
            </div>
          </div>

          {view === 'calendar' ? (
            <BillCalendar
              month={month}
              onPick={(iso, picked) => {
                const match = bills.find((b) => b.id === picked[0].id);
                if (match) setEditing(match);
              }}
            />
          ) : null}

          <section className="card p-5" hidden={view === 'calendar'}>
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2 className="text-xl">On a date</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing({ ...blank })}>
                <PlusIcon width={15} height={15} /> Add
              </button>
            </div>
            {dated.length ? (
              <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {dated.map((b) => (
                  <BillRow key={b.id} b={b} today={data.today} onToggle={toggle} onEdit={setEditing} />
                ))}
              </ul>
            ) : <p className="text-sm text-mute py-4">Nothing dated this month.</p>}
          </section>

          {spread.length ? (
            <section className="card p-5" hidden={view === 'calendar'}>
              <h2 className="text-xl mb-1">Spread across the month</h2>
              <p className="text-xs text-mute mb-2">No fixed date, so each paycheck carries an even share.</p>
              <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {spread.map((b) => (
                  <BillRow key={b.id} b={b} today={data.today} onToggle={toggle} onEdit={setEditing} />
                ))}
              </ul>
            </section>
          ) : null}

          {!bills.length ? (
            <Empty
              title="No bills yet"
              hint="Add the fixed ones once and they will repeat every month."
              action={(
                <button type="button" className="btn btn-primary" onClick={() => setEditing({ ...blank })}>
                  Add an expense
                </button>
              )}
            />
          ) : null}
        </>
      )}

      {editing ? (
        <ExpenseForm
          initial={{
            id: editing.expenseId || editing.id,
            expenseId: editing.expenseId,
            name: editing.name ?? '',
            amount: editing.amount ?? '',
            category: editing.category ?? 'Other',
            dueDay: editing.spread ? '' : (editing.dueDate ? Number(editing.dueDate.slice(8, 10)) : ''),
            isRecurring: editing.isRecurring ?? true,
            notes: editing.notes ?? '',
            endDate: editing.endDate ?? '',
          }}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}
