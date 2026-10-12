import { useState } from 'react';

import { Empty, Skeleton } from '../components/ui.jsx';
import { useApp, useResource } from '../lib/store.jsx';

const DRAW_LABEL = { '14:00': '2 PM', '17:00': '5 PM', '21:00': '9 PM' };
const drawLabel = (t) => DRAW_LABEL[String(t).slice(0, 5)] || String(t).slice(0, 5);

const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(`${String(d).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

const pct = (v) => (Number.isFinite(Number(v)) ? `${Number(v)}%` : 'n/a');
const targetLabel = (p) => (p.draw_time ? `Scored only against the ${drawLabel(p.draw_time)} draw` : '');
const pickKey = (p) => `${p.pick_date}-${p.draw_time}-${p.slot}`;
const SLOTS = [
  { time: '14:00', pickLabel: '11 AM' },
  { time: '17:00', pickLabel: '3 PM' },
  { time: '21:00', pickLabel: '6 PM' },
];

// Manila wall clock, so the empty state follows the real day and hour rather
// than the viewer's device timezone.
function manilaNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const g = (t) => parts.find((x) => x.type === t).value;
  return { date: g('year') + '-' + g('month') + '-' + g('day'), minutes: Number(g('hour')) * 60 + Number(g('minute')) };
}

// Backend may flag top_pick; otherwise the highest numeric model_score in the
// group wins. Never assumes slot 1. Top pick is listed first, rest keep order.
export function orderGroup(group) {
  if (!group.length) return { ordered: group, topKey: null };
  let top = group.find((p) => p.top_pick === true);
  if (!top) {
    let best = -Infinity;
    for (const p of group) {
      const v = Number(p.model_score);
      if (p.model_score != null && Number.isFinite(v) && v > best) { best = v; top = p; }
    }
  }
  if (!top) return { ordered: group, topKey: null };
  return { ordered: [top, ...group.filter((p) => p !== top)], topKey: top };
}

function drawPassed(pickDay, time) {
  const now = manilaNow();
  const day = String(pickDay || now.date).slice(0, 10);
  if (day < now.date) return true;
  if (day > now.date) return false;
  const [h, m] = time.split(':').map(Number);
  return now.minutes >= h * 60 + m;
}


function Odds({ p, groupMax }) {
  const o = p.odds || {};
  const ms = Number(p.model_score);
  const hasScore = p.model_score !== undefined && p.model_score !== null && Number.isFinite(ms);
  return (
    <div className="w-full space-y-1.5">
      <dl className="text-[0.7rem] leading-snug space-y-0.5">
        <div className="flex justify-between gap-2">
          <dt className="text-mute">exact order</dt>
          <dd className="tabular-nums">{pct(o.straightPercent)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-mute">any order{o.permutations ? ` (${o.permutations} way${o.permutations === 1 ? '' : 's'})` : ''}</dt>
          <dd className="tabular-nums">{pct(o.anyOrderPercent)}</dd>
        </div>
      </dl>
      {hasScore ? (
        <div>
          <div className="flex justify-between gap-2 text-[0.7rem]">
            <span className="text-mute">model score</span>
            <span className="tabular-nums">{ms.toFixed(3)}% · {(ms / 0.1).toFixed(2)}× avg</span>
          </div>
          <div
            className="mt-1 h-1.5 rounded-pill overflow-hidden"
            style={{ background: 'color-mix(in srgb, var(--ink) 8%, transparent)' }}
            role="img"
            aria-label={'Model share ' + ms.toFixed(3) + ' percent of all 1000 combinations, ' + (ms / 0.1).toFixed(2) + ' times the average. Bar is relative to the strongest pick in this draw. Not a chance of winning.'}
          >
            <div className="h-full rounded-pill" style={{ width: (groupMax > 0 ? Math.max(4, Math.min(100, (ms / groupMax) * 100)) : 0) + '%', background: 'var(--gold)' }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Digits({ combo, big, tone }) {
  const chars = String(combo ?? '').replace(/\D/g, '').split('');
  const size = big ? 'w-10 h-14 text-4xl' : 'w-7 h-9 text-xl';
  return (
    <span className="inline-flex gap-1.5 shrink-0" aria-label={`Combination ${chars.join(' ')}`} role="img">
      {chars.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`${size} grid place-items-center rounded-lg font-display leading-none`}
          style={{
            border: '1px solid var(--line)',
            background: 'var(--paper)',
            color: tone || 'var(--ink)',
          }}
        >
          {c}
        </span>
      ))}
    </span>
  );
}

function Strategy({ breakdown }) {
  if (!breakdown || typeof breakdown !== 'object') return null;
  const entries = Object.entries(breakdown)
    .map(([k, v]) => [k, Number(v)])
    .filter(([, v]) => Number.isFinite(v))
    .sort((x, y) => y[1] - x[1]);
  if (!entries.length) return null;
  return (
    <ul className="w-full space-y-0.5" aria-label="Strategy contributions">
      {entries.map(([k, v]) => (
        <li key={k} className="flex justify-between gap-2 text-[0.68rem] text-mute tabular-nums">
          <span className="truncate">{k.replace(/_/g, ' ')}</span>
          <span>{v.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}

function scoreSummary(scores = []) {
  if (!scores.length) return null;
  const straight = scores.filter((s) => s.straight).length;
  const ramb = scores.filter((s) => s.rambolito).length;
  const digits = scores.reduce((a, s) => a + (s.digit_hits || 0), 0);
  return { straight, ramb, digits, n: scores.length };
}

function PickCard({ p, index, isTop, groupMax }) {
  const sum = scoreSummary(p.scores);
  return (
    <li
      className="card p-4 flex flex-col items-start gap-3"
      style={isTop ? { borderColor: 'var(--gold)', boxShadow: '0 0 0 1px var(--gold)' } : undefined}
    >
      <div className="flex items-center justify-between gap-1 flex-wrap w-full">
        <span className="eyebrow">pick {p.slot ?? index + 1}</span>
        {isTop ? <span className="chip gold">top pick</span> : null}
        {sum ? (
          <span className={`chip ${sum.straight ? 'teal' : sum.ramb ? 'gold' : ''}`}>
            {sum.straight ? 'straight' : sum.ramb ? 'rambolito' : `${sum.digits} digit${sum.digits === 1 ? '' : 's'}`}
          </span>
        ) : null}
      </div>
      <Digits combo={p.combo} big />
      <p className="text-xs text-mute">{p.outcome?.status === 'scored' ? `Exact order ${p.outcome.straight} · Any order ${p.outcome.anyOrder}` : 'Pending official result'}</p>
      <Odds p={p} groupMax={groupMax} />
      <Strategy breakdown={p.strategy_breakdown} />
    </li>
  );
}

function HistoryRow({ p }) {
  const o = p.outcome;
  return (
    <li className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{fmtDate(p.pick_date)} {String(p.pick_date).slice(0, 4)} · {drawLabel(p.draw_time)} · pick {p.slot}</p>
          <div className="mt-2"><Digits combo={p.combo} /></div>
        </div>
        <p className="text-[0.7rem] text-mute text-right shrink-0 max-w-[8rem]">{targetLabel(p)}</p>
      </div>
      {o?.status === 'scored' ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-mute">Official result</span><Digits combo={o.result} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <span className={`chip ${o.straight === 'hit' ? 'teal' : ''}`}>Exact order {o.straight}</span>
            <span className={`chip ${o.anyOrder === 'hit' ? 'gold' : ''}`}>Any order {o.anyOrder}</span>
          </div>
          <p className="text-xs text-mute">{o.digitHits} matching digits · {o.positionHits} in the same position. Partial matches are not wins.</p>
        </div>
      ) : (
        <p className="text-xs text-mute mt-3">Pending · {o?.reason === 'draw not yet held' ? 'draw not yet held' : 'awaiting the official result'}. Not counted as a miss.</p>
      )}
    </li>
  );
}

function Results({ results, count }) {
  const rows = [...results]
    .sort((a, b) => `${b.draw_date}${b.draw_time}`.localeCompare(`${a.draw_date}${a.draw_time}`))
    .slice(0, count);
  if (!rows.length) return <Empty title="No draws loaded" hint="Draw results will appear here soon." />;
  return (
    <ul className="card divide-y" style={{ '--tw-divide-opacity': 1 }}>
      {rows.map((r, i) => (
        <li
          key={`${r.draw_date}${r.draw_time}`}
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}
        >
          <span className="text-sm min-w-0">
            {fmtDate(r.draw_date)} <span className="text-mute">· {drawLabel(r.draw_time)}</span>
            {/^https?:\/\//.test(r.source || '') ? (
              <a
                href={r.source}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[0.7rem] underline text-mute"
                aria-label={`Source archive for ${fmtDate(r.draw_date)} ${drawLabel(r.draw_time)} draw`}
              >
                {r.officialVerified ? 'official PCSO' : 'source archive · not officially verified'}
              </a>
            ) : r.source ? (
              <span className="block text-[0.7rem] text-mute">{r.source}</span>
            ) : null}
          </span>
          <Digits combo={r.combo} />
        </li>
      ))}
    </ul>
  );
}

function Strategies({ strategies }) {
  if (!strategies.length) return <p className="text-sm text-mute">Strategy results will appear here soon.</p>;
  const max = Math.max(...strategies.map((s) => Number(s.weight) || 0), 0.0001);
  return (
    <ul className="card p-4 space-y-4">
      {strategies.map((s) => {
        const pct = ((Number(s.weight) || 0) / max) * 100;
        return (
          <li key={s.strategy}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm">{String(s.strategy).replace(/_/g, ' ')}</span>
              <span className="text-xs text-mute tabular-nums">weight {Number(s.weight).toFixed(2)}</span>
            </div>
            <div
              className="mt-1.5 h-2 rounded-pill overflow-hidden"
              style={{ background: 'color-mix(in srgb, var(--ink) 8%, transparent)' }}
              aria-hidden="true"
            >
              <div className="h-full rounded-pill" style={{ width: `${pct}%`, background: 'var(--teal)' }} />
            </div>
            <p className="text-[0.7rem] text-mute mt-1.5 tabular-nums">
              backtest: {Math.round(Number(s.trials) || 0)} trials · {s.straight_hits ?? 0} straight · {s.any_order_hits ?? 0} any order · {s.digit_hits ?? 0} digits
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function Frequency({ frequency }) {
  const rows = [...frequency].sort((a, b) => Number(a.digit) - Number(b.digit));
  if (!rows.length) return <p className="text-sm text-mute">Digit counts will appear here soon.</p>;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="card p-4">
      <ul className="flex items-end justify-between gap-1.5 h-32" aria-label="Digit frequency">
        {rows.map((r) => (
          <li key={r.digit} className="flex-1 flex flex-col items-center justify-end h-full gap-1" aria-label={`Digit ${r.digit} drawn ${r.count} times`}>
            <span className="text-[0.62rem] text-mute tabular-nums">{r.count}</span>
            <span
              className="w-full rounded-t-md"
              style={{ height: `${Math.max(4, (r.count / max) * 100)}%`, background: 'var(--gold)', opacity: 0.85 }}
            />
          </li>
        ))}
      </ul>
      <ul className="flex justify-between gap-1.5 mt-1.5" aria-hidden="true">
        {rows.map((r) => (
          <li key={r.digit} className="flex-1 text-center font-display text-lg leading-none">{r.digit}</li>
        ))}
      </ul>
    </div>
  );
}

function Analysis({ a }) {
  const hot = [...(a.hotDigits ?? [])].sort((x, y) => y.count - x.count);
  const maxHot = Math.max(...hot.map((h) => h.count), 1);
  const pairs = (a.recentPairs ?? []).slice(0, 8);
  const pos = Array.isArray(a.hotPositions) ? a.hotPositions : [];
  const posName = ['first', 'second', 'third'];
  const pt = a.patterns;
  const y = a.yesterday;
  const noPicks = y && !(Array.isArray(y.picks) ? y.picks.length : Number(y.picks));
  const yPicks = Array.isArray(y?.picks) ? y.picks : [];
  return (
    <div className="card p-4 space-y-5">
      {a.windowLabel ? <p className="text-xs text-mute">Looking at {a.windowLabel}.</p> : null}
      {(a.summary ?? []).length ? (
        <ul className="space-y-2">
          {a.summary.map((t, i) => (
            <li key={i} className="text-sm leading-relaxed flex gap-2">
              <span aria-hidden="true" className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--gold)' }} />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {hot.length ? (
        <div>
          <p className="eyebrow mb-2">hot digits</p>
          <ul className="flex flex-wrap gap-1.5">
            {hot.slice(0, 5).map((h) => (
              <li key={h.digit} className="chip gold" aria-label={`Digit ${h.digit}, ${h.count} times`}>
                <span className="font-display text-base leading-none mr-1">{h.digit}</span>
                <span className="tabular-nums" style={{ opacity: 0.4 + 0.6 * (h.count / maxHot) }}>×{h.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pos.length ? (
        <div>
          <p className="eyebrow mb-2">hot by position</p>
          <ul className="grid grid-cols-3 gap-2">
            {pos.slice(0, 3).map((list, i) => (
              <li key={i} className="text-xs">
                <p className="text-mute mb-1">{posName[i]}</p>
                <p className="font-display text-lg leading-tight tabular-nums">
                  {(list ?? []).slice(0, 3).map((d) => d.digit).join(' ') || 'n/a'}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pairs.length ? (
        <div>
          <p className="eyebrow mb-2">recent pairs</p>
          <ul className="flex flex-wrap gap-1.5">
            {pairs.map((p) => (
              <li key={p.pair} className="chip" aria-label={`Pair ${p.pair}, ${p.count} times`}>
                <span className="font-display text-base leading-none mr-1">{String(p.pair).replace(/\D/g, '')}</span>
                <span className="tabular-nums">×{p.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pt ? (
        <p className="text-sm text-mute">
          In {pt.draws} draws: {pt.doubles} {Number(pt.doubles) === 1 ? 'had a double' : 'had doubles'} and {pt.triples} {Number(pt.triples) === 1 ? 'was a triple' : 'were triples'}.
        </p>
      ) : null}

      {y ? (
        <div>
          <p className="eyebrow mb-1.5">yesterday’s picks{y.date ? ` · ${fmtDate(y.date)}` : ''}</p>
          {noPicks ? (
            <p className="text-sm text-mute">No picks were recorded yesterday, so there is nothing to score.</p>
          ) : (
            <>
              {yPicks.length ? (
                <ul className="flex flex-wrap gap-3 mb-2">
                  {yPicks.map((p, i) => <li key={i}><Digits combo={typeof p === 'object' ? p.combo : p} /></li>)}
                </ul>
              ) : null}
              <p className="text-sm">
                {y.scoredDraws
                  ? `Scored against ${y.scoredDraws} draw${y.scoredDraws === 1 ? '' : 's'}: ${y.straightHits ?? 0} straight, ${y.anyOrderHits ?? 0} any order, ${y.digitHits ?? 0} digit hits.`
                  : 'No draws have been scored against them yet.'}
              </p>
            </>
          )}
        </div>
      ) : null}

      <p className="text-xs text-mute leading-relaxed">
        A daily recap of what has been drawn lately{a.generatedAt ? `, written ${new Date(a.generatedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}. It describes the past and does not predict the next draw.
      </p>
    </div>
  );
}

export default function Swertres() {
  const { data, loading, error, reload } = useResource('/swertres');
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const [historyCount, setHistoryCount] = useState(24);
  const [resultsCount, setResultsCount] = useState(9);

  const refresh = async () => {
    setBusy(true);
    const r = await reload();
    setBusy(false);
    toast(r ? 'Showing the latest saved results' : 'Could not load results', r ? 'ok' : 'error');
  };

  const picks = data?.picks ?? [];
  const history = data?.history ?? [];
  const results = data?.results ?? [];
  const cov = data?.coverage;

  return (
    <div className="space-y-6 enter">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold)' }}>just for fun</p>
          <h1 className="text-3xl mt-1">Swer<em className="italic">tres</em>.</h1>
          <p className="text-sm text-mute mt-1">
            {data?.today ? `Picks for ${fmtDate(data.today)}.` : 'Four picks a day.'}
          </p>
          <p className="text-[0.7rem] text-mute mt-1 max-w-[16rem] leading-snug">
            Refresh reloads what is already saved. It does not fetch new draws.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm shrink-0"
          onClick={refresh}
          disabled={busy}
          aria-busy={busy}
          aria-label="Reload the saved Swertres picks and results"
        >
          {busy ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {error ? <div className="card p-5" role="alert"><p className="text-sm">{error}</p></div> : null}

      {loading && !data ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-card" />)}
        </div>
      ) : data ? (
        <>
          <section aria-labelledby="sw-today" className="space-y-3">
            <h2 id="sw-today" className="eyebrow">today’s picks</h2>
            {SLOTS.map(({ time, pickLabel }) => {
              const { ordered: group, topKey } = orderGroup(picks.filter((p) => String(p.draw_time).slice(0, 5) === time));
              return (
                <div key={time} className="space-y-2">
                  <h3 className="font-display text-xl">{drawLabel(time)} draw</h3>
                  {group.length ? (
                    <ul className="grid grid-cols-2 gap-3">
                      {group.map((p, i) => <PickCard key={pickKey(p)} p={p} index={i} isTop={p === topKey} groupMax={Math.max(0, ...group.map((q) => Number(q.model_score) || 0))} />)}
                    </ul>
                  ) : (
                    <p className="card-flat p-3 text-sm text-mute">
                      {drawPassed(data.today, time) ? 'No picks were recorded before this draw.' : 'Awaiting the ' + pickLabel + ' picks.'}
                    </p>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-mute leading-relaxed">
              Picks are made before each draw (around 11 AM, 3 PM and 6 PM) and are only scored against their own draw. The percentages under each pick are the real odds, and they are the same for every pick of that shape. The model score only ranks a pick against all 1000 combinations, and it is not a chance of winning.
            </p>
          </section>

          {data.analysis ? (
            <section aria-labelledby="sw-an" className="space-y-3">
              <h2 id="sw-an" className="eyebrow">daily analysis</h2>
              <Analysis a={data.analysis} />
            </section>
          ) : null}

          <section aria-labelledby="sw-draws" className="space-y-3">
            <h2 id="sw-draws" className="eyebrow">recent winning numbers</h2>
            <Results results={results} count={resultsCount} />
            {resultsCount < results.length ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => setResultsCount((n) => n + 30)}>Show older results ({results.length - resultsCount} more)</button> : null}
            {cov ? (
              <p className="text-xs text-mute">
                {cov.draws} draws stored, {fmtDate(cov.from)} to {fmtDate(cov.to)}
                {cov.missing ? `, ${Array.isArray(cov.missing) ? cov.missing.length : cov.missing} missing` : ''}.
              </p>
            ) : null}
          </section>

          <section aria-labelledby="sw-hist" className="space-y-3">
            <h2 id="sw-hist" className="eyebrow">pick history · {history.length} saved</h2>
            <p className="text-xs text-mute">Every saved pick stays here. Results are checked around 2:45, 5:45 and 9:45 PM; if PCSO has not published a draw yet, it stays pending until a later check.</p>
            {history.length ? (
              <><ul className="space-y-3">{history.slice(0, historyCount).map((p) => <HistoryRow key={pickKey(p)} p={p} />)}</ul>{historyCount < history.length ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHistoryCount((n) => n + 24)}>Show older picks ({history.length - historyCount} more)</button> : null}</>
            ) : (
              <Empty title="Nothing to score yet" hint="Only real picks are listed. Scores appear after a draw." />
            )}
          </section>

          <section aria-labelledby="sw-strat" className="space-y-3">
            <h2 id="sw-strat" className="eyebrow">strategy weights</h2>
            <p className="text-xs text-mute leading-relaxed">
              Walk-forward historical backtest: each method is scored on past draws it had not seen. These are not live wins from picks you played.
            </p>
            <Strategies strategies={data.strategies ?? []} />
          </section>

          <section aria-labelledby="sw-freq" className="space-y-3">
            <h2 id="sw-freq" className="eyebrow">digit frequency</h2>
            <Frequency frequency={data.frequency ?? []} />
          </section>

          <aside className="card-flat p-4" role="note">
            <p className="text-sm leading-relaxed">
              <strong>Honest note.</strong> Swertres draws are random. Nothing here gives better odds than any other number, and past results cannot predict the next draw. The weights only show which method happened to match more often so far. Play for fun and only what you would happily spend.
            </p>
          </aside>
        </>
      ) : null}
    </div>
  );
}
