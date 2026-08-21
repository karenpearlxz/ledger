import { Link } from 'react-router-dom';

import { AlertIcon } from '../components/icons.jsx';
import { Bar, Skeleton } from '../components/ui.jsx';
import { dollar, fmtDate, fmtMonthShort, peso, relativeDay } from '../lib/format.js';
import { useResource } from '../lib/store.jsx';

function Stat({ label, value, tone, hint }) {
  return (
    <div className="flex-1 min-w-[128px]">
      <p className="eyebrow mb-1">{label}</p>
      <p className="amount text-xl" style={tone ? { color: tone } : undefined}>{value}</p>
      {hint ? <p className="text-xs text-mute mt-0.5">{hint}</p> : null}
    </div>
  );
}

function PaycheckCard({ p, today, highlight }) {
  const short = p.leftover !== null && p.leftover < 0;
  return (
    <article
      className="card p-5 shrink-0 w-[280px] snap-start"
      style={highlight ? { borderColor: 'color-mix(in srgb, var(--teal) 55%, transparent)' } : undefined}
    >
      {/* gap-2 let the chip and the date very nearly touch on a 280px card.
          They need real space, and the date must never wrap mid-phrase. */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <span className={`chip shrink-0 ${highlight ? 'teal' : ''}`}>
          {highlight ? 'this paycheck' : 'upcoming'}
        </span>
        <span className="text-xs text-mute whitespace-nowrap">{relativeDay(p.payDate, today)}</span>
      </div>

      <p className="font-display text-3xl leading-none">{peso(p.amountPhp)}</p>
      <p className="text-xs text-mute mt-1">
        {dollar(p.amountUsd)} lands {fmtDate(p.payDate, { month: 'short', day: 'numeric', weekday: 'short' })}
      </p>
      {p.overridden ? (
        <p className="text-xs mt-1.5 truncate" style={{ color: 'var(--gold)' }}
          title={p.override?.note || 'manually adjusted'}>
          adjusted{p.override?.note ? ` · ${p.override.note}` : ''}
        </p>
      ) : null}

      <hr className="rule my-4" />

      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-dim">Bills it covers</dt>
          <dd className="amount">{peso(p.billsDue)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-dim">Left over</dt>
          <dd className="amount font-semibold" style={{ color: short ? 'var(--ember)' : 'var(--teal)' }}>
            {peso(p.leftover)}
          </dd>
        </div>
      </dl>

      {p.bills.length ? (
        <ul className="mt-3 space-y-1">
          {p.bills.slice(0, 4).map((b) => (
            <li key={b.id} className="flex justify-between gap-3 text-xs text-mute">
              <span className="truncate">{b.paidOn ? '✓ ' : ''}{b.name}</span>
              <span className="amount shrink-0">{peso(b.amountPhp)}</span>
            </li>
          ))}
          {p.bills.length > 4 ? (
            <li className="text-xs text-mute">+{p.bills.length - 4} more</li>
          ) : null}
        </ul>
      ) : (
        <p className="text-xs text-mute mt-3">Nothing dated falls in this window.</p>
      )}
    </article>
  );
}

export default function Home() {
  const { data, loading, error } = useResource('/finance');

  if (error) {
    return (
      <div className="card p-6" role="alert">
        <p className="font-display text-xl mb-1">Could not load</p>
        <p className="text-sm text-mute">{error}</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="card p-6 space-y-3">
          <Skeleton className="h-3 w-24" /><Skeleton className="h-10 w-56" /><Skeleton className="h-3 w-40" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-56 w-[280px] rounded-card" />
          <Skeleton className="h-56 w-[280px] rounded-card" />
        </div>
      </div>
    );
  }

  const { totals, income, fx, paychecks, goals, accounts, netWorth, bills, trend, today } = data;
  const overdue = bills.filter((b) => b.overdue);
  const nextUp = bills
    .filter((b) => !b.paidOn && !b.spread && b.dueDate >= today)
    .slice(0, 5);
  const maxTrend = Math.max(1, ...trend.map((t) => t.spent));

  return (
    <div className="space-y-5 enter">
      <section className="card p-6">
        <p className="eyebrow mb-1">left this month after fixed costs</p>
        <p className="font-display text-[2.75rem] leading-none">
          {peso(totals.leftover)}
        </p>
        <p className="text-sm text-mute mt-1.5">
          {peso(income.monthlyPhp)} in, {peso(totals.monthlyFixed)} committed
        </p>

        <hr className="rule my-5" />

        <div className="flex flex-wrap gap-5">
          <Stat label="Paid so far" value={peso(totals.paid)} tone="var(--teal)" />
          <Stat label="Still owed" value={peso(totals.unpaid)} />
          <Stat
            label="Rate"
            value={fx.rate ? `₱${fx.rate.toFixed(2)}` : '—'}
            hint={fx.rate ? `per $1 · ${fx.stale ? `stale, ${fx.day}` : 'today'}` : 'unavailable'}
            tone={fx.stale ? 'var(--gold)' : undefined}
          />
        </div>
      </section>

      {overdue.length ? (
        <Link
          to="/bills"
          className="card p-4 flex items-center gap-3 no-underline"
          style={{ borderColor: 'var(--ember)', color: 'var(--ink)' }}
        >
          <AlertIcon style={{ color: 'var(--ember)' }} className="shrink-0" />
          {/* min-w-0 is load bearing: without it a flex child refuses to
              shrink below its content, `truncate` never truncates, and the
              whole document grows sideways. */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {overdue.length} overdue bill{overdue.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-mute truncate">
              {overdue.map((b) => b.name).join(', ')}
            </p>
          </div>
          <span className="amount text-sm shrink-0" style={{ color: 'var(--ember)' }}>
            {peso(overdue.reduce((a, b) => a + b.amountPhp, 0))}
          </span>
        </Link>
      ) : null}

      <section>
        <h2 className="text-xl mb-3">Paychecks</h2>
        <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-4 px-4">
          {paychecks.map((p) => (
            <PaycheckCard key={p.payDate} p={p} today={today} highlight={p.isCurrent} />
          ))}
        </div>
      </section>

      {nextUp.length ? (
        <section className="card p-5">
          <h2 className="text-xl mb-3">Coming up</h2>
          <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {nextUp.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm truncate">{b.name}</p>
                  <p className="text-xs text-mute">
                    {fmtDate(b.dueDate)} · {relativeDay(b.dueDate, today)}
                  </p>
                </div>
                <span className="amount text-sm shrink-0">{peso(b.amountPhp)}</span>
              </li>
            ))}
          </ul>
          <Link to="/bills" className="btn btn-ghost btn-sm mt-3">All bills</Link>
        </section>
      ) : null}

      <div className="col-2 space-y-5 lg:space-y-0">
      {goals.length ? (
        <section className="card p-5">
          <h2 className="text-xl mb-4">Saving for</h2>
          <div className="space-y-4">
            {goals.map((g) => (
              <div key={g.id}>
                <div className="flex justify-between items-baseline gap-3 mb-1.5">
                  <span className="text-sm">{g.name}</span>
                  <span className="amount text-xs text-mute">
                    {peso(g.saved)} / {peso(g.targetAmount)}
                  </span>
                </div>
                <Bar percent={g.percent} color={g.color} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card p-5">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-xl">Net worth</h2>
          <span className="amount text-lg">{peso(netWorth)}</span>
        </div>
        <ul className="space-y-2.5">
          {accounts.map((a) => (
            <li key={a.id} className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.color }} aria-hidden="true" />
              <span className="text-sm flex-1 truncate">{a.name}</span>
              <span className="amount text-sm">
                {a.balance === null ? <span className="text-mute">not set</span> : peso(a.balancePhp)}
              </span>
            </li>
          ))}
        </ul>
        <Link to="/money" className="btn btn-ghost btn-sm mt-4">Update balances</Link>
      </section>

      {trend.length > 1 ? (
        <section className="card p-5 span-2">
          <h2 className="text-xl mb-4">Spending</h2>
          <div className="flex items-end gap-2 h-28">
            {trend.map((t) => (
              <div key={t.month} className="flex-1 flex flex-col items-center gap-1.5 justify-end h-full">
                <span className="amount text-[0.6rem] text-mute">{Math.round(t.spent / 1000)}k</span>
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${Math.max(4, (t.spent / maxTrend) * 100)}%`,
                    background: 'color-mix(in srgb, var(--teal) 70%, transparent)',
                  }}
                />
                <span className="text-[0.6rem] text-mute">{fmtMonthShort(t.month)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      </div>
    </div>
  );
}
