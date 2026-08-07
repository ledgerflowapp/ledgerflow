# 03 — Identity Reconciliation State Refactoring

**What to build:** Rename ambiguous override state variables in ContactReconciliationWizard (`selectedGhostKey` -> `ghostKeyOverride`) and isolate scope creep in SplitExpenseDrawer to ensure clear, pure state derivation.

**Blocked by:** 01 — Event-Driven Form Resets in Transaction Drawers

**Status: completed**

- [x] Rename `selectedGhostKey` state variable and handler in `ContactReconciliationWizard.tsx` to `ghostKeyOverride`.
- [x] Clean up redundant prop-copying effects in `ContactReconciliationWizard.tsx`.
- [x] Ensure state derivation for ghost key reconciliation is pure and readable.
