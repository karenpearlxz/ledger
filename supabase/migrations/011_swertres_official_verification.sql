begin;
alter table ledger.swertres_results add column official_verified_at timestamptz;
comment on column ledger.swertres_results.official_verified_at is 'Non-null only after matching the combination to the official PCSO search result for this exact date and time.';
commit;
