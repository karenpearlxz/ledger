-- How often an expense actually recurs.
--
-- `amount` is now the amount of ONE occurrence. Everything downstream works in
-- a monthly equivalent, so a weekly or fortnightly cost stops being quietly
-- understated as if it were monthly:
--
--   weekly    amount * 52 / 12
--   biweekly  amount * 26 / 12
--   monthly   amount
--   quarterly amount, but only in the months it actually lands
--   yearly    amount, but only in the month it actually lands
--
-- Existing rows are monthly, which is exactly what they were before, so the
-- default keeps every stored amount meaning the same thing.
alter table ledger.expenses
  add column if not exists frequency text not null default 'monthly';

alter table ledger.expenses
  drop constraint if exists expenses_frequency_check;

alter table ledger.expenses
  add constraint expenses_frequency_check
  check (frequency in ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'));

-- A weekly or fortnightly cost has no single day of the month it lands on, so
-- it is always treated as spread. Guard it in the database rather than trusting
-- every caller to remember.
alter table ledger.expenses
  drop constraint if exists expenses_subm_day_check;

alter table ledger.expenses
  add constraint expenses_subm_day_check
  check (frequency not in ('weekly', 'biweekly') or due_day is null);
