# 01 — Drizzle DB Client & Core Schema Setup

**What to build:** The foundational Drizzle ORM client configuration and complete TypeScript database schema models representing all database tables, columns, indexes, foreign keys, and enums from the pulled PostgreSQL schema.

**Blocked by:** None — can start immediately

**Status:** completed

- [x] `drizzle-orm`, `drizzle-kit`, and PostgreSQL database client driver packages installed.
- [x] `drizzle.config.ts` created and configured with PostgreSQL connection parameters.
- [x] Drizzle database client instance initialized in `src/db/index.ts`.
- [x] TypeScript schema definitions written under `src/db/schema/` mapping all core tables (`users`, `profiles`, `ledgers`, `personal_ledgers`, `friend_ledgers`, `groups`, `group_members`, `contacts`, `categories`, `transactions`, `goals`, `goal_contributions`, `recurring_transactions`, `currency_conversions`).
- [x] Unified schema exported from `src/db/schema/index.ts` with no TypeScript compilation errors.
