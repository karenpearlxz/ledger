import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { PlusIcon } from './icons.jsx';
import { ConfirmButton, Sheet } from './ui.jsx';
import { api } from '../lib/api.js';
import { fmtDate, peso } from '../lib/format.js';
import { useApp, useResource } from '../lib/store.jsx';

const cents = (c) => peso(c / 100, true);
const OWED_CSS = `
/* Global toasts sit at 80. A modal, including its scrim, must outrank them. */
.owed-dialog .sheet-backdrop { z-index: 81; }
.owed-dialog .sheet { z-index: 82; }
.owed-section .btn, .owed-section .sheet .btn { min-height: 44px; min-width: 44px; }
.owed-section .sheet .btn-sm { min-height: 44px; padding-inline: 14px; }
.owed-section .sheet-head > div { min-width: 0; }
.owed-section .sheet-head h2, .owed-section .sheet-head p { overflow-wrap: anywhere; }
.owed-section .sheet .label, .owed-section label.label { display: block; font-size: 13px; color: var(--ink); opacity: .85; margin-bottom: 4px; }
.owed-section .sheet input, .owed-section .sheet textarea, .owed-section .sheet select { font-size: 16px; min-height: 44px; }
.owed-section .btn:disabled { opacity: .5; cursor: not-allowed; }
`;
const STATUS = { paid: 'paid', partial: 'partly paid', outstanding: 'unpaid' };

const fieldsOf = (l) => ({
  name: l?.name ?? '', amount: l?.amount ?? '', lentDate: l?.lentDate ?? '', dueDate: l?.dueDate ?? '', notes: l?.notes ?? '',
});

/** Same body again keeps the same operation id (safe retry); a new body or a success gets a fresh one. */
function opIdFor(ref, body) {
  const key = JSON.stringify(body);
  if (!ref.current || ref.current.key !== key) ref.current = { key, id: crypto.randomUUID() };
  return ref.current.id;
}

function LoanSheet({ loanId, loan, today, onClose, onChanged }) {
  const isNew = !loanId;
  const { toast } = useApp();
  const baseRef = useRef(fieldsOf(loan));
  const createOp = useRef(null);
  const payOp = useRef(null);
  const conflictRef = useRef(false);
  const [editVersion, setEditVersion] = useState(null);
  const [name, setName] = useState(loan?.name ?? '');
  const [amount, setAmount] = useState(loan?.amount ?? '');
  const [lentDate, setLentDate] = useState(loan?.lentDate ?? today);
  if (isNew && baseRef.current.lentDate === '') baseRef.current = { ...baseRef.current, lentDate: today };
  const [dueDate, setDueDate] = useState(loan?.dueDate ?? '');
  const [notes, setNotes] = useState(loan?.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [armed, setArmed] = useState(false);
  const [armedSettle, setArmedSettle] = useState(false);
  // payment form: editing === null (new) or payment id
  const [editing, setEditing] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(today);
  const [payNotes, setPayNotes] = useState('');
  const [payErr, setPayErr] = useState('');
  const [armedPay, setArmedPay] = useState(null);

  // Fresh server data: update only fields she hasn't touched; dirty edits stay.
  useEffect(() => {
    if (!loan) return;
    const prev = baseRef.current;
    const next = fieldsOf(loan);
    setName((c) => (c === prev.name ? next.name : c));
    setAmount((c) => (c === prev.amount ? next.amount : c));
    setLentDate((c) => (c === prev.lentDate ? next.lentDate : c));
    setDueDate((c) => (c === prev.dueDate ? next.dueDate : c));
    setNotes((c) => (c === prev.notes ? next.notes : c));
    baseRef.current = next;
    if (conflictRef.current) { conflictRef.current = false; setEditVersion(loan.version); }
  }, [loan]);

  async function run(fn, okMsg, setError = setErr, onResult) {
    setBusy(true);
    setError('');
    try {
      const res = await fn();
      if (onResult) onResult(res);
      await onChanged();
      if (okMsg) toast(okMsg);
      return res ?? true;
    } catch (e) {
      setError(e.message);
      toast(e.message, 'error');
      if (e.status === 409) { conflictRef.current = true; await onChanged(); }
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const body = {
      name: name.trim(), amount: String(amount).trim(), lentDate,
      dueDate: dueDate || null, notes: notes.trim(),
    };
    const submitted = { name, amount, lentDate, dueDate, notes };
    const ok = await run(
      () => (isNew
        ? api.post('/owed', { ...body, operationId: opIdFor(createOp, body) })
        : api.put(`/owed/${loanId}`, { ...body, version: loan.version })),
      isNew ? `${body.name} added` : 'Saved',
      setErr,
      (res) => {
        if (isNew) { createOp.current = null; return; }
        const saved = fieldsOf(res.loan);
        baseRef.current = saved;
        setName((c) => (c === submitted.name ? saved.name : c));
        setAmount((c) => (c === submitted.amount ? saved.amount : c));
        setLentDate((c) => (c === submitted.lentDate ? saved.lentDate : c));
        setDueDate((c) => (c === submitted.dueDate ? saved.dueDate : c));
        setNotes((c) => (c === submitted.notes ? saved.notes : c));
      },
    );
    if (ok && isNew) onClose();
  }

  async function removeLoan() {
    const ok = await run(() => api.del(`/owed/${loanId}`), `${loan.name} removed`);
    if (ok) onClose();
  }

  function resetPay() {
    setEditing(null); setEditVersion(null); setPayAmount(''); setPayDate(today); setPayNotes(''); setPayErr('');
  }

  async function submitPay(e) {
    e.preventDefault();
    const body = { amount: String(payAmount).trim(), paidDate: payDate, notes: payNotes.trim() };
    const ok = await run(
      () => (editing
        ? api.put(`/owed/${loanId}/payments/${editing}`, { ...body, version: editVersion ?? loan.version })
        : api.post(`/owed/${loanId}/payments`, { ...body, operationId: opIdFor(payOp, body) })),
      editing ? 'Payment updated' : 'Payment recorded',
      setPayErr,
    );
    if (ok) { if (!editing) payOp.current = null; resetPay(); }
  }

  async function removePay(p) {
    setArmedPay(null);
    const ok = await run(() => api.del(`/owed/${loanId}/payments/${p.id}`), 'Payment removed', setPayErr);
    if (ok && editing === p.id) resetPay();
  }

  async function settle() {
    setArmedSettle(false);
    await run(
      () => api.post(`/owed/${loanId}/settle`, {
        paidDate: today, notes: 'Marked paid', expectedRemainingCents: loan.remainingCents,
      }),
      'Marked paid',
      setPayErr,
    );
  }

  const status = loan?.status;
  // Fixed panels must escape the page's animated/transformed containers.
  return createPortal(
    <div className="owed-section owed-dialog">
    <Sheet
      title={isNew ? 'New loan' : loan.name}
      subtitle={isNew
        ? 'Tracking only. Nothing here changes your account balances.'
        : `${cents(loan.remainingCents)} left of ${cents(loan.amountCents)} · ${STATUS[status]}`}
      onClose={onClose}
      footer={(
        <div className="flex gap-2 justify-between items-center flex-wrap w-full">
          {isNew ? <span /> : (
            <fieldset disabled={busy} className="border-0 p-0 m-0 min-w-0" data-testid="owed-delete">
              <ConfirmButton label="Delete loan" onConfirm={removeLoan} armed={armed} setArmed={setArmed} />
            </fieldset>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            <button type="submit" form="owed-form" className="btn btn-primary" data-testid="owed-save" disabled={busy}>
              {busy ? 'Saving...' : (isNew ? 'Add loan' : 'Save')}
            </button>
          </div>
        </div>
      )}
    >
      <form id="owed-form" onSubmit={submit} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4 min-w-0 border-0 p-0 m-0">
        <div>
          <label className="label" htmlFor="owed-name">Who owes you</label>
          <input id="owed-name" data-testid="owed-name" className="field" style={{ fontSize: 16 }}
            value={name} maxLength={80} required onChange={(e) => setName(e.target.value)} placeholder="Name" />
        </div>
        <div>
          <label className="label" htmlFor="owed-amount">Amount lent (PHP)</label>
          <input id="owed-amount" data-testid="owed-amount" className="field" style={{ fontSize: 16 }}
            inputMode="decimal" value={amount} required onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="owed-lent-date">Date lent</label>
            <input id="owed-lent-date" data-testid="owed-lent-date" type="date" className="field" style={{ fontSize: 16 }}
              value={lentDate} required onChange={(e) => setLentDate(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="owed-due-date">Due (optional)</label>
            <input id="owed-due-date" data-testid="owed-due-date" type="date" className="field" style={{ fontSize: 16 }}
              value={dueDate} min={lentDate || undefined} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="owed-notes">Notes</label>
          <textarea id="owed-notes" data-testid="owed-notes" className="field" style={{ fontSize: 16 }} rows={2}
            value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {err ? <p className="text-sm text-ember" role="alert">{err}</p> : null}
      </fieldset>
      </form>

      {isNew ? null : (
        <fieldset disabled={busy} className="mt-6 pt-5 border-t border-line min-w-0 border-x-0 border-b-0 p-0 m-0" style={{ paddingTop: 20, marginTop: 24 }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-lg">Payments</h3>
            {loan.remainingCents > 0 ? (
              <span data-testid="owed-mark-paid">
                <ConfirmButton
                  label="Mark paid" confirmLabel={`Pay ${cents(loan.remainingCents)}`}
                  onConfirm={settle} armed={armedSettle} setArmed={setArmedSettle}
                />
              </span>
            ) : <span className="text-sm text-mute">Fully paid</span>}
          </div>

          {loan.payments.length === 0 ? <p className="text-sm text-mute mb-3">No payments yet.</p> : (
            <ul className="mb-4">
              {loan.payments.map((p) => (
                <li key={p.id} className="flex items-center gap-2 py-1.5" data-testid="owed-payment-row">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm amount">{cents(p.amountCents)}</span>
                    <span className="block text-xs text-mute truncate">{fmtDate(p.paidDate)}{p.notes ? ` · ${p.notes}` : ''}</span>
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ minHeight: 44 }}
                    aria-label={`Edit payment of ${cents(p.amountCents)} on ${fmtDate(p.paidDate)}`}
                    onClick={() => { setEditing(p.id); setEditVersion(loan.version); setPayAmount(p.amount); setPayDate(p.paidDate); setPayNotes(p.notes ?? ''); setPayErr(''); }}>
                    Edit
                  </button>
                  <ConfirmButton
                    label="Delete" onConfirm={() => removePay(p)}
                    armed={armedPay === p.id} setArmed={(v) => setArmedPay(v ? p.id : null)}
                  />
                </li>
              ))}
            </ul>
          )}

          {loan.remainingCents > 0 || editing ? (
            <form onSubmit={submitPay} className="space-y-3">
              <p className="label">{editing ? 'Edit payment' : 'Record a payment'}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="owed-pay-amount">Amount</label>
                  <input id="owed-pay-amount" data-testid="owed-pay-amount" className="field" style={{ fontSize: 16 }}
                    inputMode="decimal" value={payAmount} required onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="label" htmlFor="owed-pay-date">Date</label>
                  <input id="owed-pay-date" data-testid="owed-pay-date" type="date" className="field" style={{ fontSize: 16 }}
                    value={payDate} min={loan.lentDate} required onChange={(e) => setPayDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="owed-pay-notes">Note</label>
                <input id="owed-pay-notes" data-testid="owed-pay-notes" className="field" style={{ fontSize: 16 }}
                  value={payNotes} maxLength={200} onChange={(e) => setPayNotes(e.target.value)} />
              </div>
              {payErr ? <p className="text-sm text-ember" role="alert">{payErr}</p> : null}
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" style={{ minHeight: 44 }} data-testid="owed-pay-save" disabled={busy}>
                  {editing ? 'Save payment' : 'Add payment'}
                </button>
                {editing ? <button type="button" className="btn btn-ghost" style={{ minHeight: 44 }} onClick={resetPay}>Cancel</button> : null}
              </div>
            </form>
          ) : (payErr ? <p className="text-sm text-ember" role="alert">{payErr}</p> : null)}
        </fieldset>
      )}
    </Sheet>
    </div>,
    document.body,
  );
}

export default function OwedToMe() {
  const { data, loading, error, reload } = useResource('/owed');
  const [open, setOpen] = useState(null); // 'new' | loan id

  const loans = data?.loans ?? [];
  const current = open && open !== 'new' ? loans.find((l) => l.id === open) : null;

  return (
    <section className="card p-5 owed-section" data-testid="owed-section" aria-labelledby="owed-heading">
      <style>{OWED_CSS}</style>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl mb-1" id="owed-heading">Owed to me</h2>
          <p className="text-sm text-mute">Tracking only. Nothing here changes your account balances.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm shrink-0" style={{ minHeight: 44 }}
          data-testid="owed-new" disabled={!data?.today} onClick={() => setOpen('new')}>
          <PlusIcon width={15} height={15} /> Add loan
        </button>
      </div>

      {error ? <p className="text-sm text-ember mt-3" role="alert">{error}</p> : null}
      {loading && !data ? <p className="text-sm text-mute mt-3">Loading...</p> : null}

      {data ? (
        <>
          <p className="font-display text-[2rem] leading-none mt-4" data-testid="owed-total">
            {cents(data.totalOutstandingCents)}
          </p>
          <p className="text-xs text-mute mt-1">outstanding</p>
          <hr className="rule my-4" />
          {loans.length === 0 ? <p className="text-sm text-mute">Nobody owes you anything.</p> : (
            <ul className="space-y-1">
              {loans.map((l) => {
                const overdue = l.dueDate && l.remainingCents > 0 && l.dueDate < data.today;
                return (
                  <li key={l.id}>
                    <button type="button" data-testid="owed-loan-row" onClick={() => setOpen(l.id)}
                      className="w-full flex items-center gap-3 py-2.5 text-left" style={{ minHeight: 44 }}
                      aria-label={`Open ${l.name}, ${cents(l.remainingCents)} remaining`}>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-sm truncate ${l.status === 'paid' ? 'text-mute' : ''}`}>{l.name}</span>
                        <span className="block text-xs text-mute truncate">
                          {STATUS[l.status]} · lent {fmtDate(l.lentDate)}
                          {l.dueDate ? ` · due ${fmtDate(l.dueDate)}${overdue ? ' (overdue)' : ''}` : ''}
                          {l.paidCents > 0 ? ` · ${cents(l.paidCents)} of ${cents(l.amountCents)} paid` : ''}
                        </span>
                      </span>
                      <span className="amount text-sm shrink-0">{cents(l.remainingCents)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}

      {open === 'new' && data?.today ? (
        <LoanSheet key="new" today={data?.today ?? ''} onClose={() => setOpen(null)} onChanged={reload} />
      ) : null}
      {current ? (
        <LoanSheet key={current.id} loanId={current.id} loan={current}
          today={data.today} onClose={() => setOpen(null)} onChanged={reload} />
      ) : null}
    </section>
  );
}
