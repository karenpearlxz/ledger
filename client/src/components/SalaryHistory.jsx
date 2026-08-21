import { useState } from 'react';

import { api } from '../lib/api.js';
import { dollar, fmtLongDate, peso } from '../lib/format.js';
import { useApp, useResource } from '../lib/store.jsx';
import { ConfirmButton, Skeleton } from './ui.jsx';

const blankRate = (d) => ({ effectiveFrom: d, amountUsd: '', note: '' });
const blankOverride = (d) => ({ payDate: d, amount: '', currency: 'PHP', note: '' });

/**
 * Two related but different controls, kept visibly apart because confusing them
 * is the whole problem:
 *
 *   Rate changes  - "from this date I earn X" - carries forward forever.
 *   Adjustments   - "this ONE cheque was actually Y" - a prorated or odd payday.
 */
export default function SalaryHistory({ paychecks = [], onChanged }) {
  const { toast } = useApp();
  const { data, loading, reload } = useResource('/salary');
  const [rateForm, setRateForm] = useState(null);
  const [ovForm, setOvForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(null);

  const rates = data?.rates || [];
  const overrides = data?.overrides || [];
  const todayIso = new Date().toISOString().slice(0, 10);

  async function refresh() {
    await reload();
    // The paycheck cards live off /finance, so they have to be told too.
    if (onChanged) await onChanged();
  }

  async function run(fn, okMessage) {
    setBusy(true);
    try {
      await fn();
      await refresh();
      toast(okMessage);
      return true;
    } catch (err) {
      toast(err.message, 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }

  const saveRate = async (e) => {
    e.preventDefault();
    const body = {
      effectiveFrom: rateForm.effectiveFrom,
      amountUsd: Number(rateForm.amountUsd),
      note: rateForm.note || '',
    };
    const ok = await run(
      () => (rateForm.id ? api.patch(`/salary/rates/${rateForm.id}`, body) : api.post('/salary/rates', body)),
      rateForm.id ? 'Rate updated' : 'Rate change saved',
    );
    if (ok) setRateForm(null);
  };

  const saveOverride = async (e) => {
    e.preventDefault();
    const ok = await run(
      () => api.put(`/salary/overrides/${ovForm.payDate}`, {
        amount: Number(ovForm.amount),
        currency: ovForm.currency,
        note: ovForm.note || '',
      }),
      'Paycheck adjusted',
    );
    if (ok) setOvForm(null);
  };

  if (loading && !data) {
    return <section className="card p-5"><Skeleton className="h-6 w-40" /></section>;
  }

  return (
    <>
      <section className="card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <h2 className="text-xl">Rate changes</h2>
          {!rateForm ? (
            <button type="button" className="btn btn-ghost"
              onClick={() => setRateForm(blankRate(todayIso))}>Add a raise</button>
          ) : null}
        </div>
        <p className="text-sm text-mute mb-4">
          Each paycheck is valued at the rate in force on its pay date, so a raise no
          longer rewrites what you earned last month.
        </p>

        {rateForm ? (
          <form onSubmit={saveRate} className="rounded-card border border-line p-4 mb-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="r-from">In effect from</label>
                <input id="r-from" className="field" type="date" required value={rateForm.effectiveFrom}
                  onChange={(e) => setRateForm((f) => ({ ...f, effectiveFrom: e.target.value }))} />
              </div>
              <div>
                <label className="label" htmlFor="r-amt">Per paycheck (USD)</label>
                <input id="r-amt" className="field amount" type="number" step="0.01" min="0" required
                  inputMode="decimal" placeholder="1625" value={rateForm.amountUsd}
                  onChange={(e) => setRateForm((f) => ({ ...f, amountUsd: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="r-note">Note</label>
              <input id="r-note" className="field" maxLength={200} placeholder="why it changed"
                value={rateForm.note} onChange={(e) => setRateForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-ghost" onClick={() => setRateForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        ) : null}

        {rates.length === 0 ? (
          <p className="text-sm text-mute">
            No rate changes recorded. Every paycheck uses your current rate from Income above.
          </p>
        ) : (
          <ul className="space-y-2">
            {rates.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 flex-wrap
                                        rounded-card border border-line px-4 py-3">
                <div className="min-w-0">
                  <p className="amount text-lg">{dollar(r.amountUsd)}</p>
                  <p className="text-xs text-mute">
                    from {fmtLongDate(r.effectiveFrom)}{r.note ? ` · ${r.note}` : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" className="btn btn-ghost btn-sm"
                    onClick={() => setRateForm({ ...r, amountUsd: String(r.amountUsd) })}>Edit</button>
                  <ConfirmButton label="Delete" armed={armed === `r${r.id}`}
                    setArmed={(v) => setArmed(v ? `r${r.id}` : null)}
                    onConfirm={() => run(() => api.del(`/salary/rates/${r.id}`), 'Rate removed')} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <h2 className="text-xl">Paycheck adjustments</h2>
          {!ovForm ? (
            <button type="button" className="btn btn-ghost"
              onClick={() => setOvForm(blankOverride(paychecks[0]?.payDate || todayIso))}>Adjust one</button>
          ) : null}
        </div>
        <p className="text-sm text-mute mb-4">
          For a single cheque that came out different, like a prorated period. An
          amount in pesos is taken exactly as typed and never re-converted, so a
          moving exchange rate cannot rewrite what already landed.
        </p>

        {ovForm ? (
          <form onSubmit={saveOverride} className="rounded-card border border-line p-4 mb-4 space-y-3">
            <div>
              <label className="label" htmlFor="o-date">Pay date</label>
              <input id="o-date" className="field" type="date" required value={ovForm.payDate}
                onChange={(e) => setOvForm((f) => ({ ...f, payDate: e.target.value }))} />
              {paychecks.length ? (
                <div className="flex gap-2 flex-wrap mt-2">
                  {paychecks.map((p) => (
                    <button key={p.payDate} type="button"
                      className={`chip ${ovForm.payDate === p.payDate ? 'teal' : ''}`}
                      onClick={() => setOvForm((f) => ({ ...f, payDate: p.payDate }))}>
                      {fmtLongDate(p.payDate)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="o-amt">Amount actually paid</label>
                <input id="o-amt" className="field amount" type="number" step="0.01" min="0" required
                  inputMode="decimal" value={ovForm.amount}
                  onChange={(e) => setOvForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="label" htmlFor="o-cur">Currency</label>
                <select id="o-cur" className="field" value={ovForm.currency}
                  onChange={(e) => setOvForm((f) => ({ ...f, currency: e.target.value }))}>
                  <option value="PHP">Pesos, as received</option>
                  <option value="USD">Dollars, convert at today&apos;s rate</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="o-note">Note</label>
              <input id="o-note" className="field" maxLength={200} placeholder="prorated, bonus, short period"
                value={ovForm.note} onChange={(e) => setOvForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-ghost" onClick={() => setOvForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        ) : null}

        {overrides.length === 0 ? (
          <p className="text-sm text-mute">No adjustments. Every cheque uses its rate.</p>
        ) : (
          <ul className="space-y-2">
            {overrides.map((o) => (
              <li key={o.payDate} className="flex items-center justify-between gap-3 flex-wrap
                                             rounded-card border border-line px-4 py-3">
                <div className="min-w-0">
                  <p className="amount text-lg">
                    {o.currency === 'PHP' ? peso(o.amount, true) : dollar(o.amount)}
                  </p>
                  <p className="text-xs text-mute">
                    {fmtLongDate(o.payDate)}{o.note ? ` · ${o.note}` : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" className="btn btn-ghost btn-sm"
                    onClick={() => setOvForm({ ...o, amount: String(o.amount) })}>Edit</button>
                  <ConfirmButton label="Remove" armed={armed === `o${o.payDate}`}
                    setArmed={(v) => setArmed(v ? `o${o.payDate}` : null)}
                    onConfirm={() => run(() => api.del(`/salary/overrides/${o.payDate}`), 'Adjustment removed')} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
