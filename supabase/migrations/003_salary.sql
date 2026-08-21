-- Salary history + per-paycheck overrides.
--
-- Two separate ideas, deliberately:
--
--   salary_rates      "from this date my rate became X" - the ongoing truth.
--                     A paycheck is valued at the rate in force on its pay date,
--                     so raising her salary no longer rewrites what past cheques
--                     were worth.
--
--   paycheck_overrides "this ONE cheque was actually Y" - the escape hatch for
--                     prorated periods (Aug 28 2026 straddles a rate change) and
--                     for any cheque that just landed different. Stored in the
--                     currency she was actually paid in, because a PHP amount she
--                     already received must not drift when the FX rate moves.
--
-- An override always wins over a rate.

create table if not exists ledger.salary_rates (
  id             uuid primary key default gen_random_uuid(),
  effective_from date not null unique,
  amount_usd     numeric(12,2) not null check (amount_usd >= 0),
  note           text not null default '',
  created_at     timestamptz not null default now()
);

create index if not exists salary_rates_effective_idx
  on ledger.salary_rates (effective_from desc);

create table if not exists ledger.paycheck_overrides (
  pay_date   date primary key,
  amount     numeric(14,2) not null check (amount >= 0),
  currency   text not null default 'PHP' check (currency in ('PHP', 'USD')),
  note       text not null default '',
  created_at timestamptz not null default now()
);

alter table ledger.salary_rates       enable row level security;
alter table ledger.paycheck_overrides enable row level security;

revoke all on all tables in schema ledger from anon, authenticated;
revoke all on schema ledger from anon, authenticated;
