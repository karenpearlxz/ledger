-- Ledger lives in its own schema on a shared Postgres. Nothing here reads or
-- writes public, reno or alibi.

create extension if not exists pgcrypto with schema extensions;

-- Single user, so there is no users table. The cookie carries a signed session
-- id and this row is the revocation list.
create table if not exists ledger.sessions (
  id         uuid primary key default extensions.gen_random_uuid(),
  label      text not null default '',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_expiry_idx on ledger.sessions (expires_at);

create table if not exists ledger.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists ledger.categories (
  id         uuid primary key default extensions.gen_random_uuid(),
  name       text not null,
  name_lower text generated always as (lower(name)) stored,
  color      text not null default '#7A756B',
  kind       text not null default 'expense' check (kind in ('expense','income')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
create unique index if not exists categories_name_key on ledger.categories (name_lower);

-- A row here is a definition. due_day null means the cost is spread across the
-- month rather than landing on a date.
create table if not exists ledger.expenses (
  id           uuid primary key default extensions.gen_random_uuid(),
  name         text not null,
  amount       numeric(14,2) not null default 0 check (amount >= 0),
  currency     text not null default 'PHP' check (currency in ('PHP','USD')),
  due_day      smallint check (due_day between 1 and 31),
  category     text not null default 'Other',
  is_recurring boolean not null default true,
  start_date   date not null default current_date,
  end_date     date,
  notes        text not null default '',
  sort_order   integer not null default 100,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint expenses_dates_ordered check (end_date is null or end_date >= start_date),
  constraint expenses_oneoff_has_day check (is_recurring or due_day is not null)
);
create index if not exists expenses_active_idx on ledger.expenses (archived_at, sort_order);
create index if not exists expenses_category_idx on ledger.expenses (category);

-- Materialised month instances, created on demand. Editing a definition never
-- rewrites a month that has already been reconciled.
create table if not exists ledger.expense_payments (
  id           uuid primary key default extensions.gen_random_uuid(),
  expense_id   uuid not null references ledger.expenses(id) on delete cascade,
  period       date not null,
  due_date     date not null,
  amount       numeric(14,2) not null check (amount >= 0),
  paid_on      date,
  paid_amount  numeric(14,2) check (paid_amount >= 0),
  notes        text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint expense_payments_period_is_month_start check (extract(day from period) = 1),
  unique (expense_id, period)
);
create index if not exists expense_payments_period_idx on ledger.expense_payments (period);
create index if not exists expense_payments_due_idx on ledger.expense_payments (due_date) where paid_on is null;

create table if not exists ledger.accounts (
  id          uuid primary key default extensions.gen_random_uuid(),
  name        text not null,
  kind        text not null default 'bank' check (kind in ('bank','ewallet','savings','cash','credit')),
  currency    text not null default 'PHP' check (currency in ('PHP','USD')),
  color       text not null default '#2F5D50',
  note        text not null default '',
  sort_order  integer not null default 100,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Manual balance snapshots. The newest per account is the current balance and
-- the series is the net-worth chart.
create table if not exists ledger.balances (
  id         uuid primary key default extensions.gen_random_uuid(),
  account_id uuid not null references ledger.accounts(id) on delete cascade,
  as_of      date not null default current_date,
  amount     numeric(16,2) not null,
  created_at timestamptz not null default now(),
  unique (account_id, as_of)
);
create index if not exists balances_as_of_idx on ledger.balances (as_of desc);

create table if not exists ledger.goals (
  id            uuid primary key default extensions.gen_random_uuid(),
  name          text not null,
  target_amount numeric(16,2) not null check (target_amount > 0),
  target_date   date,
  color         text not null default '#C6862F',
  note          text not null default '',
  sort_order    integer not null default 100,
  archived_at   timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists ledger.goal_contributions (
  id         uuid primary key default extensions.gen_random_uuid(),
  goal_id    uuid not null references ledger.goals(id) on delete cascade,
  on_date    date not null default current_date,
  amount     numeric(16,2) not null,
  note       text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists goal_contributions_goal_idx on ledger.goal_contributions (goal_id, on_date desc);

-- fx_rate is snapshotted per paycheck so history does not move with the peso.
create table if not exists ledger.paychecks (
  id         uuid primary key default extensions.gen_random_uuid(),
  pay_date   date not null,
  amount_usd numeric(14,2) not null default 0 check (amount_usd >= 0),
  fx_rate    numeric(12,4) check (fx_rate > 0),
  amount_php numeric(16,2),
  note       text not null default '',
  received   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (pay_date)
);

create table if not exists ledger.fx_rates (
  day        date primary key,
  usd_php    numeric(12,4) not null check (usd_php > 0),
  source     text not null default 'open.er-api.com',
  fetched_at timestamptz not null default now()
);

-- Actual money movement, which is what trend and category breakdown read.
create table if not exists ledger.transactions (
  id                 uuid primary key default extensions.gen_random_uuid(),
  on_date            date not null default current_date,
  description        text not null,
  amount             numeric(16,2) not null check (amount >= 0),
  kind               text not null default 'expense' check (kind in ('expense','income','transfer')),
  category           text not null default 'Other',
  account_id         uuid references ledger.accounts(id) on delete set null,
  expense_payment_id uuid references ledger.expense_payments(id) on delete set null,
  notes              text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists transactions_date_idx on ledger.transactions (on_date desc);
create index if not exists transactions_category_idx on ledger.transactions (category);
create index if not exists transactions_kind_idx on ledger.transactions (kind);
