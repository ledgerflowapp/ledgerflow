# 02 — Shared Default Account & Form State Helpers

**What to build:** Unify duplicated default account fallback logic (`accounts?.find(a => a.is_default) || accounts?.[0]`) and form reset triggers across transaction drawers into clean, reusable utility functions/hooks.

**Blocked by:** 01 — Event-Driven Form Resets in Transaction Drawers

**Status:** ready-for-agent

- [ ] Extract default account resolution logic into a reusable helper function.
- [ ] Refactor `PersonalTransactionDrawer.tsx`, `BusinessTransactionDrawer.tsx`, and `SplitExpenseDrawer.tsx` to consume the unified default account resolution helper.
- [ ] Ensure default account resolution is evaluated purely within render scope.
