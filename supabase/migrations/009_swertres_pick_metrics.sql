begin;
alter table ledger.swertres_draw_picks add column if not exists odds jsonb;
alter table ledger.swertres_draw_picks add column if not exists model_score double precision;
-- Add metrics only; original prediction, creation time and breakdown remain untouched.
update ledger.swertres_draw_picks set odds=jsonb_build_object(
 'straightPercent',0.1,
 'anyOrderPercent',case
   when split_part(combo,'-',1)=split_part(combo,'-',2) and split_part(combo,'-',2)=split_part(combo,'-',3) then 0.1
   when split_part(combo,'-',1)=split_part(combo,'-',2) or split_part(combo,'-',1)=split_part(combo,'-',3) or split_part(combo,'-',2)=split_part(combo,'-',3) then 0.3
   else 0.6 end,
 'permutations',case
   when split_part(combo,'-',1)=split_part(combo,'-',2) and split_part(combo,'-',2)=split_part(combo,'-',3) then 1
   when split_part(combo,'-',1)=split_part(combo,'-',2) or split_part(combo,'-',1)=split_part(combo,'-',3) or split_part(combo,'-',2)=split_part(combo,'-',3) then 3
   else 6 end
) where odds is null;
update ledger.swertres_draw_picks set model_score=(strategy_breakdown->>'model_score_pct')::double precision where model_score is null;
alter table ledger.swertres_draw_picks alter column odds set not null;
alter table ledger.swertres_draw_picks alter column model_score set not null;
alter table ledger.swertres_draw_picks add constraint swertres_model_score_percent check(model_score>=0 and model_score<=100);
commit;
