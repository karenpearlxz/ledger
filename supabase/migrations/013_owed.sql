-- Separate receivables only. No existing finance, content or blog rows change.
begin;
create table if not exists ledger.owed_loans (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 100),
  amount_cents bigint not null check (amount_cents between 1 and 9999999999),
  lent_date date not null,
  due_date date check (due_date is null or due_date >= lent_date),
  notes text not null default '' check (length(notes) <= 4000),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists ledger.owed_payments (
  id uuid primary key default extensions.gen_random_uuid(),
  loan_id uuid not null references ledger.owed_loans(id) on delete cascade,
  amount_cents bigint not null check (amount_cents between 1 and 9999999999),
  paid_date date not null,
  notes text not null default '' check (length(notes) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists owed_payments_loan_idx on ledger.owed_payments(loan_id,paid_date,created_at);
create index if not exists owed_loans_lent_idx on ledger.owed_loans(lent_date desc,created_at desc);
alter table ledger.owed_loans enable row level security;
alter table ledger.owed_payments enable row level security;
revoke all on ledger.owed_loans,ledger.owed_payments from anon,authenticated;
commit;
