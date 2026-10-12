begin;
create table ledger.swertres_confirmed_draw_picks (like ledger.swertres_draw_picks including all);
create table ledger.swertres_confirmed_draw_scores (
 pick_date date not null, pick_draw_time text not null, slot smallint not null,
 draw_date date not null, draw_time text not null,
 straight boolean not null, rambolito boolean not null,
 digit_hits smallint not null check(digit_hits between 0 and 3),
 position_hits smallint not null check(position_hits between 0 and 3),
 scored_at timestamptz not null default now(),
 primary key(pick_date,pick_draw_time,slot),
 check(pick_date=draw_date and pick_draw_time=draw_time),
 foreign key(pick_date,pick_draw_time,slot) references ledger.swertres_confirmed_draw_picks(pick_date,draw_time,slot),
 foreign key(draw_date,draw_time) references ledger.swertres_results(draw_date,draw_time)
);
alter table ledger.swertres_confirmed_draw_picks enable row level security;
alter table ledger.swertres_confirmed_draw_scores enable row level security;
revoke all on ledger.swertres_confirmed_draw_picks,ledger.swertres_confirmed_draw_scores from anon,authenticated;
commit;
