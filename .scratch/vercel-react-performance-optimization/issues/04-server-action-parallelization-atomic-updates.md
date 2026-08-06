# 04 — Server Action Parallelization & Atomic Balance Updates

**What to build:** Decrease API latency for server actions (`categories.ts`, `contacts.ts`, `friends.ts`, `transactions.ts`) by parallelizing independent database queries via `Promise.all()` and updating account balances atomically in SQL.

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] Combine independent DB queries in `getBudgets` (`categories.ts`) using `Promise.all()`.
- [x] Parallelize DB queries in `mergeContactToUserProfile` (`contacts.ts`) and friend action handlers (`friends.ts`).
- [x] Refactor `updateTransactionAction` (`transactions.ts`) to perform atomic SQL balance updates (`balance = balance + delta`) instead of fetching `accountRecord` first.
- [x] Verify server actions run cleanly and pass unit tests.
