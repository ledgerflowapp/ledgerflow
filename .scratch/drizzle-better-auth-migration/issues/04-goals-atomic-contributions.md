# 04 — Financial Goals & Atomic Contributions

**What to build:** End-to-end goal management and atomic goal contribution processing using Drizzle ORM transactions, replacing the `atomic_contribute_goal_rpc` PostgreSQL procedure.

**Blocked by:** 03 — Personal Transactions & Ledger Actions

**Status:** completed

- [x] Goal creation and management Server Actions created in `src/lib/actions/goals.ts`.
- [x] `atomic_contribute_goal_rpc` translated into a Drizzle transaction with overcontribution guard checks.
- [x] Goal UI hooks (`useContributeGoal`) refactored to invoke the Server Action and update goal progress indicators.
- [x] Vitest unit tests (`useContributeGoal.test.ts`) updated and passing with Drizzle implementation.

