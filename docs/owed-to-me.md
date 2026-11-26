The Money page includes a separate receivables ledger. It tracks people, principal, date lent, optional due date, notes, and an editable repayment history. The outstanding total is calculated from principal less recorded payments. Paid status is derived, never manually stored; marking paid records the exact remaining amount as a dated repayment. Deleting that repayment reopens the loan.

This is bookkeeping only. Creating, repaying, settling or deleting a loan never writes to bank accounts, account balances, expenses, expense payments or net worth. Nothing moves actual money.

Migrations `013_owed.sql` and `014_owed_retry_safety.sql` are additive. The separate `owed_loans` and `owed_payments` tables use integer centavos, bounded positive principal/payment amounts, genuine calendar dates, a foreign key and row-level security. Anonymous and Supabase authenticated roles have no direct table privileges. The authenticated Ledger API is the only application interface.

Every balance mutation locks its parent loan inside a transaction. An overpayment or principal reduction below the amount already repaid is refused. Metadata and payment edits check the displayed loan version to reject stale writes. A full payment is idempotent and checks the remaining amount shown before recording it.

Loan and payment creation require a client-generated UUID operation ID. Unique indexes and a canonical request hash make a retry of the same request return the existing result, while reusing that ID with a different payload is rejected. The UI retains the operation ID after a network error. Existing nullable retry metadata is left untouched.

All API routes require Ledger's passcode session, return private/no-store responses and refuse cross-origin writes. Names and notes are plain text, escaped by React. Loan deletion cascades only to that loan's repayment log and requires an inline confirmation in the UI.

Unsaved borrower fields survive payment updates and conflict refreshes. Controls are disabled while mutations are pending. Editing a payment captures the current loan version; after a conflict, the draft is kept for review and an explicit retry.

Take and verify a fresh full database backup before applying a migration. `server/src/lib/backup.js` produces a repeatable-read snapshot with mode 0600. Keep the pre-feature backup as the preservation baseline. Never replace a baseline to hide an unexpected change.

Run the unit tests with the command below.

```sh
node --test server/tests/owed.test.js
```

The API suite requires a pre-013 full backup and verifies that every original non-authentication row is byte-for-byte unchanged, plus the two expected additive migration records. It creates only its own UUID-tracked fixtures, deletes their repayment logs by cascade, restores the original receivables total and locks its session with a verified 401.

```sh
OWED_BASELINE=/private/path/to/pre-owed-full-backup.json node server/scripts/owed-check.js
BASE_URL=https://your-ledger-host.example OWED_BASELINE=/private/path/to/pre-owed-full-backup.json node server/scripts/owed-check.js
```

API and browser suites share the atomic lock `/tmp/ledger-owed-verification.lock`. Run the API suite once per host sequentially, then run the browser suite across all four host/viewport combinations. Never overlap these mutation suites, since their ephemeral fixtures would invalidate each other’s aggregate baseline. A lock belongs to the process and inode that created it. Do not clear another live process’s lock. Capture a unique run prefix, source commit and served asset hash. Verify both production hosts at desktop and 390px, inspect the actual screenshots, exercise logged-out and logged-in flows, clean only tracked fixture IDs and verify every test session is locked. Concurrent legitimate edits must be investigated, not overwritten or silently ignored.

Run the browser suite from the sandbox with Playwright installed under `/home/kit`. Source and served-asset hashes are logged, and an optional expected source commit can be enforced.

```sh
OWED_EXPECTED_SHA=$(git rev-parse HEAD) node server/scripts/owed-ui-check.mjs
```

The owed dialog is portaled directly to the document body so page transforms cannot move its fixed positioning. Its backdrop and panel sit at layers 81 and 82, above global notifications at 80. Errors remain inline. Browser regressions exercise opening from a scrolled page, scrolling the panel body while header/footer stay fixed, 44px action targets, and a notification-dismiss area geometrically overlapping Save while the hit still reaches Save.

The final product revision is `7a2b423`. Both live hosts matched the built asset hash. Verification passed all 47 API checks per host, five exact-centavo/date unit tests, and four complete desktop/390px browser cases. All 36 final screenshots were inspected. A final read-only comparison preserved complete rows in all 29 original non-authentication/non-migration tables, including the owner’s concurrent finance additions from the pre-feature snapshot. Test loans and payments were removed, and every test session was locked with a protected 401 verified.
