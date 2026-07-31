# 03 — Personal Transactions & Ledger Actions

**What to build:** End-to-end personal transaction management using server-side Drizzle ORM actions and transactions, replacing the `atomic_add_transaction_rpc` PostgreSQL stored procedure and Supabase client querying.

**Blocked by:** 02 — Auth & Session Management (Better Auth Integration)

**Status:** completed

- [x] `atomic_add_transaction_rpc` translated into a type-safe Drizzle transaction in `src/lib/actions/transactions.ts`.
- [x] Server Actions implemented for creating, reading, updating, and deleting personal transactions with session authorization guards.
- [x] UI transaction forms and transaction drawer components updated to call Server Actions and invalidate React Query cache.
- [x] Unified transactions feed (`useUnifiedTransactions`) updated to fetch from Drizzle queries.
- [x] Transaction creation, editing, and deletion verified working end-to-end via Vitest unit tests.
