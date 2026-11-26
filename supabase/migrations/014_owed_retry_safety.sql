-- Additive, nullable metadata leaves every existing loan and payment unchanged.
begin;
alter table ledger.owed_loans add column if not exists operation_id uuid;
alter table ledger.owed_loans add column if not exists operation_hash text;
alter table ledger.owed_payments add column if not exists operation_id uuid;
alter table ledger.owed_payments add column if not exists operation_hash text;
create unique index if not exists owed_loans_operation_unique on ledger.owed_loans(operation_id);
create unique index if not exists owed_payments_operation_unique on ledger.owed_payments(operation_id);
commit;
