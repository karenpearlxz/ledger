begin;
create table if not exists ledger.swertres_daily_runs (
 id bigint generated always as identity primary key,
 run_date date not null,
 analysis jsonb not null,
 algorithm_version text not null,
 created_at timestamptz not null default now()
);
create index if not exists swertres_daily_runs_date on ledger.swertres_daily_runs(run_date,id desc);
alter table ledger.swertres_daily_runs enable row level security;
revoke all on ledger.swertres_daily_runs from anon,authenticated;
commit;
