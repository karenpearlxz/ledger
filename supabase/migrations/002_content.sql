-- The written half of the app, migrated out of the old static dashboard.

create table if not exists ledger.figures (
  id           uuid primary key default extensions.gen_random_uuid(),
  ordinal      integer not null,
  slug         text not null,
  name         text not null,
  epithet      text not null default '',
  lifespan     text not null default '',
  chip_date    text not null default '',
  summary      text not null default '',
  body         text not null default '',
  quote        text not null default '',
  quote_source text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists figures_slug_key on ledger.figures (slug);
create index if not exists figures_ordinal_idx on ledger.figures (ordinal desc);

create table if not exists ledger.journal_entries (
  id         uuid primary key default extensions.gen_random_uuid(),
  entry_date date not null,
  title      text not null default '',
  body       text not null default '',
  mood       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists journal_date_idx on ledger.journal_entries (entry_date desc);

create table if not exists ledger.work_log (
  id         uuid primary key default extensions.gen_random_uuid(),
  entry_date date not null,
  title      text not null default '',
  body       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists work_log_date_idx on ledger.work_log (entry_date desc);

create table if not exists ledger.poems (
  id         uuid primary key default extensions.gen_random_uuid(),
  title      text not null,
  body       text not null default '',
  written_on text not null default '',
  note       text not null default '',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Express connects as the owner and is the only way in. Supabase's REST roles
-- get nothing, so a leaked anon key cannot read her journal.
alter table ledger.sessions           enable row level security;
alter table ledger.settings           enable row level security;
alter table ledger.categories         enable row level security;
alter table ledger.expenses           enable row level security;
alter table ledger.expense_payments   enable row level security;
alter table ledger.accounts           enable row level security;
alter table ledger.balances           enable row level security;
alter table ledger.goals              enable row level security;
alter table ledger.goal_contributions enable row level security;
alter table ledger.paychecks          enable row level security;
alter table ledger.fx_rates           enable row level security;
alter table ledger.transactions       enable row level security;
alter table ledger.figures            enable row level security;
alter table ledger.journal_entries    enable row level security;
alter table ledger.work_log           enable row level security;
alter table ledger.poems              enable row level security;

revoke all on all tables in schema ledger from anon, authenticated;
revoke all on schema ledger from anon, authenticated;

insert into ledger.settings (key, value) values
  ('income', '{"amountUsd": 1625, "frequency": "biweekly", "anchorPayday": "2026-08-28"}'::jsonb),
  ('profile', '{"name": "Karen", "currency": "PHP", "locale": "en-PH"}'::jsonb)
on conflict (key) do nothing;

insert into ledger.categories (name, color, kind, sort_order) values
  ('Housing',   '#8FB8C9', 'expense', 10),
  ('Transport', '#9AA7F0', 'expense', 20),
  ('Utilities', '#F0A542', 'expense', 30),
  ('Food',      '#7ABE89', 'expense', 40),
  ('Family',    '#E2A6A6', 'expense', 50),
  ('Education', '#C9A0DC', 'expense', 60),
  ('Debt',      '#B5442E', 'expense', 70),
  ('Personal',  '#C6862F', 'expense', 80),
  ('Savings',   '#2F5D50', 'expense', 90),
  ('Other',     '#A8B0AE', 'expense', 100),
  ('Salary',    '#2F5D50', 'income',  10),
  ('Freelance', '#7ABE89', 'income',  20)
on conflict (name_lower) do nothing;
