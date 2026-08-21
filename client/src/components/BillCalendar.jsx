import { useMemo } from 'react';

import { Skeleton } from './ui.jsx';
import { fmtDate, peso } from '../lib/format.js';
import { useResource } from '../lib/store.jsx';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Calendar cells are built from date parts, never from `new Date(iso)`. */
function gridFor(month) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = first.getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= days; d += 1) {
    cells.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

export default function BillCalendar({ month, onPick }) {
  const { data, loading } = useResource(`/expenses/calendar/${month}`, [month]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const d of data?.days ?? []) {
      if (!map.has(d.dueDate)) map.set(d.dueDate, []);
      map.get(d.dueDate).push(d);
    }
    return map;
  }, [data]);

  if (loading && !data) return <Skeleton className="h-64 w-full rounded-card" />;

  const cells = gridFor(month);
  const today = data?.today;

  return (
    <section className="card p-4">
      <div className="grid grid-cols-7 gap-1 mb-1" aria-hidden="true">
        {DOW.map((d, i) => (
          <div key={`${d}${i}`} className="eyebrow text-center !text-[0.6rem] py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <div key={`pad-${i}`} aria-hidden="true" />;

          const bills = byDay.get(iso) ?? [];
          const overdue = bills.some((b) => b.overdue);
          const allPaid = bills.length > 0 && bills.every((b) => b.paidOn);
          const isToday = iso === today;
          const total = bills.reduce((a, b) => a + b.amount, 0);

          const label = bills.length
            ? `${fmtDate(iso)}: ${bills.map((b) => b.name).join(', ')}, ${peso(total)}`
            : fmtDate(iso);

          return (
            <button
              key={iso}
              type="button"
              onClick={() => bills.length && onPick?.(iso, bills)}
              disabled={!bills.length}
              aria-label={label}
              aria-current={isToday ? 'date' : undefined}
              className="rounded-lg text-left p-1.5 min-h-[52px] border transition-colors disabled:cursor-default"
              style={{
                borderColor: isToday ? 'var(--teal)' : 'transparent',
                background: bills.length
                  ? `color-mix(in srgb, ${overdue ? 'var(--ember)' : allPaid ? 'var(--teal)' : 'var(--gold)'} 13%, transparent)`
                  : 'transparent',
              }}
            >
              <span
                className="amount block text-[0.7rem] leading-none"
                style={{ color: isToday ? 'var(--teal)' : 'var(--ink-dim)', fontWeight: isToday ? 600 : 400 }}
              >
                {Number(iso.slice(8, 10))}
              </span>
              {bills.length ? (
                <span
                  className="amount block text-[0.58rem] leading-tight mt-1 truncate"
                  style={{ color: overdue ? 'var(--ember)' : 'var(--ink-mute)' }}
                >
                  {Math.round(total / 1000) >= 1 ? `${Math.round(total / 1000)}k` : Math.round(total)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 flex-wrap mt-4 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
        {[['var(--gold)', 'due'], ['var(--ember)', 'overdue'], ['var(--teal)', 'paid']].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5 text-xs text-mute">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: `color-mix(in srgb, ${c} 45%, transparent)` }} />
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}
