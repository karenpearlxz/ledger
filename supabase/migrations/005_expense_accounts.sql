-- Link expenses to accounts for automatic balance deduction when paid

-- Add account_id to expenses (the default account bills come from)
alter table ledger.expenses
  add column if not exists account_id uuid references ledger.accounts(id) on delete set null;

-- Index for lookups
create index if not exists expenses_account_idx on ledger.expenses (account_id);
