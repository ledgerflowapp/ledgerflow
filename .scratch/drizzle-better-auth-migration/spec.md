Status: ready-for-agent

## Problem Statement

The user currently relies on direct Supabase client libraries (`@supabase/supabase-js`, `@supabase/ssr`), database-level PostgreSQL Row Level Security (RLS) policies, and PL/pgSQL RPC stored procedures. This creates vendor lock-in to Supabase hosting and limits flexibility when deploying to standard PostgreSQL environments (e.g. Neon, Railway, Docker, or self-hosted Postgres). Furthermore, splitting business logic across PostgreSQL stored procedures and client SDK calls makes testing and maintaining full-stack type safety difficult.

## Solution

Migrate LedgerFlow completely away from `@supabase/supabase-js` and `@supabase/ssr` to **Drizzle ORM** (`drizzle-orm`) and **Better Auth**.

All database operations will execute server-side within Next.js Server Actions and Route Handlers using Drizzle ORM. Database-level RLS policies and PL/pgSQL stored procedures (RPCs) will be translated into application-level TypeScript business logic and Drizzle transactions. Supabase Auth will be replaced with Better Auth (self-hosted, type-safe authentication integrated natively with Drizzle and Next.js App Router).

## User Stories

1. As a user, I want to register and sign in to LedgerFlow using Better Auth (email/password or Google OAuth), so that I can securely manage my account with zero vendor lock-in.
2. As a user, I want my active sessions to be securely managed via HTTP-only cookies in Next.js, so that my authentication status persists safely across page navigation.
3. As a user, I want to create, edit, and delete personal transactions using server-side Drizzle ORM actions, so that my ledger data is saved reliably in Postgres.
4. As a user, I want to view my unified transactions dashboard (combining personal, friend, and group transactions), so that I have complete oversight of my financial activities.
5. As a user, I want to contribute to financial goals through atomic Drizzle database transactions, so that goal balances and ledger entries update consistently without race conditions.
6. As a user, I want to invite friends and split expenses within groups, so that group balances and individual debt settlements recalculate accurately in TypeScript application logic.
7. As a user, I want to merge duplicate contacts into registered user profiles, so that past transaction history is correctly linked to the new profile without data loss.
8. As a user, I want recurring transactions to be automatically generated, so that scheduled expenses are recorded systematically.
9. As a developer, I want all database tables, foreign keys, enums, and indexes defined in Drizzle TypeScript schema files, so that I have end-to-end type safety and autocomplete across the codebase.
10. As a developer, I want database migrations managed via `drizzle-kit`, so that schema updates can be applied consistently in development, CI, and production.
11. As a developer, I want all authorization checks (verifying user ownership of ledgers, groups, and transactions) enforced in server-side application logic, so that access control is transparent and testable in TypeScript.
12. As a developer, I want to run tests against an isolated local PostgreSQL database without needing a Supabase emulator or proprietary CLI tools, so that unit and integration tests execute fast and reliably.

## Implementation Decisions

- **ORM & Schema**:
  - Drizzle ORM (`drizzle-orm`) as the single database client.
  - Schema defined in TypeScript under `src/db/schema/` (including `users`, `sessions`, `accounts`, `verifications`, `profiles`, `ledgers`, `personal_ledgers`, `friend_ledgers`, `groups`, `group_members`, `contacts`, `categories`, `transactions`, `goals`, `goal_contributions`, `recurring_transactions`, `currency_conversions`).
  - Migration tooling using `drizzle-kit` (`drizzle-kit generate`, `drizzle-kit migrate`).
- **Auth Provider**:
  - **Better Auth** (`better-auth`) configured with Drizzle adapter (`drizzleAdapter`).
  - Native support for Google OAuth and Email/Password credentials.
  - Session cookie handling via Next.js middleware and Better Auth client (`src/lib/auth-client.ts`).
- **Logic & Transactions**:
  - Deprecate and remove all PL/pgSQL RPC functions (`atomic_add_transaction_rpc`, `atomic_contribute_goal_rpc`, `join_group_rpc`, `group_merge_rpc`, `fix_balance_trigger_update`).
  - Re-implement complex financial operations as TypeScript Drizzle transactions (`db.transaction(async (tx) => ...)`).
  - Move access control checks (ownership of ledgers/groups) into server action guards using session user ID from Better Auth.
- **Client & API Layer**:
  - Replace `@supabase/supabase-js` client hooks with Next.js Server Actions and React Query (`@tanstack/react-query`) wrappers calling server actions.
  - Completely remove `@supabase/supabase-js` and `@supabase/ssr` dependencies from `package.json`.

## Testing Decisions

- **Testing Principles**: Tests must verify external behavior (Server Action inputs/outputs, HTTP responses, database state changes) rather than internal query builder formatting or SQL string matching.
- **Modules Tested**:
  - Server Actions (`src/lib/actions/transactions.ts`, `src/lib/actions/goals.ts`, `src/lib/actions/groups.ts`, `src/lib/actions/friends.ts`).
  - Auth flow and session middleware (`src/lib/auth.ts`, `src/middleware.ts`).
  - End-to-end user workflows via Playwright (`e2e/auth.spec.ts`, `e2e/transactions.spec.ts`).
- **Prior Art**: Existing Vitest unit tests in `src/hooks/__tests__/` and Playwright E2E tests in `e2e/auth.spec.ts`.

## Out of Scope

- Migrating historical file uploads/storage away from Supabase Storage (will use standard S3 or local storage in a separate task if needed).
- Realtime WebSocket sync (Supabase Realtime) — client polling and React Query cache invalidation will be used instead.
- Altering the current UI component layer (shadcn Base UI components remain unchanged).

## Further Notes

- Live database schema snapshot pulled via `npx supabase db pull` serves as the reference for Drizzle schema mapping.
- All environment variables will be migrated from `NEXT_PUBLIC_SUPABASE_*` to `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`.
