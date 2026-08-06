# 02 — Atomic Balance Adjustments on Transaction Edit & Soft-Delete

**What to build:** Server actions for editing and deleting transactions automatically calculate monetary deltas and update account balances atomically, maintaining historical audit integrity via soft deletion.

**Blocked by:** None — can start immediately

**Status:** completed

- [x] `updateTransactionAction` calculates the difference between original and updated transaction amounts/accounts, executing atomic account balance updates for income and expense transactions.
- [x] `deleteTransactionAction` soft-deletes the transaction record using `deleted_at` timestamp and restores/deducts the transaction amount to the associated account balance.
- [x] Database integration tests verify account balance adjustments upon transaction edits and soft deletions across expense and income types.
