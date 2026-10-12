begin;
create table if not exists ledger.swertres_results (
 draw_date date not null,
 draw_time text not null check(draw_time in ('14:00','17:00','21:00')),
 combo text not null check(combo ~ '^[0-9]-[0-9]-[0-9]$'),
 source text not null,
 fetched_at timestamptz not null default now(),
 primary key(draw_date,draw_time)
);
create table if not exists ledger.swertres_picks (
 pick_date date not null,
 slot smallint not null check(slot between 1 and 4),
 combo text not null check(combo ~ '^[0-9]-[0-9]-[0-9]$'),
 strategy_breakdown jsonb not null,
 eligible_after text not null check(eligible_after in ('14:00','17:00','21:00','next-day')),
 created_at timestamptz not null default now(),
 primary key(pick_date,slot),
 unique(pick_date,combo)
);
create table if not exists ledger.swertres_scores (
 pick_date date not null, slot smallint not null,
 draw_date date not null, draw_time text not null,
 straight boolean not null, rambolito boolean not null,
 digit_hits smallint not null check(digit_hits between 0 and 3),
 position_hits smallint not null check(position_hits between 0 and 3),
 scored_at timestamptz not null default now(),
 primary key(pick_date,slot,draw_date,draw_time),
 foreign key(pick_date,slot) references ledger.swertres_picks(pick_date,slot),
 foreign key(draw_date,draw_time) references ledger.swertres_results(draw_date,draw_time)
);
create table if not exists ledger.swertres_strategy_stats (
 strategy text primary key,
 weight double precision not null check(weight>0 and weight<1),
 trials integer not null check(trials>=0),
 straight_hits integer not null, any_order_hits integer not null, digit_hits integer not null,
 evaluation_kind text not null default 'historical walk-forward backtest',
 history_from date not null, history_to date not null,
 algorithm_version text not null, updated_at timestamptz not null default now()
);
create table if not exists ledger.swertres_weight_log (
 evaluation_date date not null, algorithm_version text not null,
 history_through date not null check(history_through<evaluation_date),
 training_draws integer not null check(training_draws>=30),
 weights_before jsonb not null, weights_after jsonb not null, rewards jsonb not null,
 evaluation_kind text not null default 'historical walk-forward backtest',
 created_at timestamptz not null default now(),
 primary key(evaluation_date,algorithm_version)
);
alter table ledger.swertres_results enable row level security;
alter table ledger.swertres_picks enable row level security;
alter table ledger.swertres_scores enable row level security;
alter table ledger.swertres_strategy_stats enable row level security;
alter table ledger.swertres_weight_log enable row level security;
revoke all on ledger.swertres_results,ledger.swertres_picks,ledger.swertres_scores,ledger.swertres_strategy_stats,ledger.swertres_weight_log from anon,authenticated;
commit;
