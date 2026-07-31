# 06 — Decommission Supabase & Final E2E Verification

**What to build:** Complete removal of `@supabase/supabase-js` and `@supabase/ssr` dependencies, cleanup of legacy Supabase helper files and environment variables, and full green verification across Vitest unit tests and Playwright E2E suites.

**Blocked by:** 04 — Financial Goals & Atomic Contributions, 05 — Groups, Friends & Shared Ledgers

**Status:** completed

- [x] `@supabase/supabase-js` and `@supabase/ssr` uninstalled from `package.json`.
- [x] Legacy Supabase helpers (`src/lib/supabase/`) deleted.
- [x] Environment variables updated in `.env.local` to use `DATABASE_URL` and `BETTER_AUTH_SECRET`.
- [x] All Vitest unit tests (`pnpm test`) pass cleanly.
- [x] All Playwright E2E tests (`pnpm test:e2e`) pass cleanly.
