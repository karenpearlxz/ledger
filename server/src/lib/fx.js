import { one } from './db.js';
import { todayISO } from './dates.js';

const SOURCE = 'open.er-api.com';
const ENDPOINT = 'https://open.er-api.com/v6/latest/USD';

let inFlight = null;

/**
 * The rate is fetched server side so the browser's connect-src can stay
 * 'self', and at most once per calendar day. A failed fetch falls back to the
 * newest stored rate and says so rather than pretending to be live: a stale
 * rate quietly presented as current would misstate her salary.
 */
export async function getRate({ force = false } = {}) {
  const today = todayISO();

  if (!force) {
    const cached = await one('select day, usd_php, source, fetched_at from fx_rates where day = $1', [today]);
    if (cached) return shape(cached, false);
  }

  if (!inFlight) {
    inFlight = fetchRate(today).finally(() => { inFlight = null; });
  }

  try {
    return await inFlight;
  } catch (err) {
    const last = await one('select day, usd_php, source, fetched_at from fx_rates order by day desc limit 1');
    if (last) return { ...shape(last, true), error: err.message };
    return { rate: null, day: null, source: null, stale: true, error: err.message };
  }
}

async function fetchRate(today) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(ENDPOINT, { signal: controller.signal });
    if (!res.ok) throw new Error(`rate provider returned ${res.status}`);
    const body = await res.json();
    const value = Number(body?.rates?.PHP);
    if (!Number.isFinite(value) || value <= 0) throw new Error('rate provider sent no usable PHP rate');

    const row = await one(
      `insert into fx_rates (day, usd_php, source, fetched_at)
            values ($1, $2, $3, now())
       on conflict (day) do update set usd_php = excluded.usd_php, fetched_at = now()
         returning day, usd_php, source, fetched_at`,
      [today, value.toFixed(4), SOURCE],
    );
    return shape(row, false);
  } finally {
    clearTimeout(timer);
  }
}

const shape = (row, stale) => ({
  rate: Number(row.usd_php),
  day: typeof row.day === 'string' ? row.day : row.day.toISOString().slice(0, 10),
  source: row.source,
  fetchedAt: row.fetched_at,
  stale,
});
