# 02 — Render-Time State Derivation & Sync useEffect Removal

**What to build:** Refactor state synchronization in transaction drawers and wizards (`ContactReconciliationWizard`, `SplitExpenseDrawer`, `PersonalTransactionDrawer`, `BusinessTransactionDrawer`) to derive values during render or set initial states in event callbacks, removing redundant `useEffect` double-render passes.

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] Remove prop-copying `useEffect` hooks in `ContactReconciliationWizard.tsx`.
- [x] Remove default account `useEffect` hooks in `SplitExpenseDrawer.tsx`, `PersonalTransactionDrawer.tsx`, and `BusinessTransactionDrawer.tsx`.
- [x] Derive fallback values (e.g. `accountId || defaultAccount?.id`) during render scope.
- [x] Initialize form default values directly in `useForm` or explicit event handlers (`onOpenChange`, selection handlers).
- [x] Verify drawer component test suite passes clean.
