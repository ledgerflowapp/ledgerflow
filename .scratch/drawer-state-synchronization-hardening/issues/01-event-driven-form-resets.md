# 01 — Event-Driven Form Resets in Transaction Drawers

**What to build:** Move side-effecting form resets out of React render scope in PersonalTransactionDrawer and BusinessTransactionDrawer. Form reset side-effects will trigger strictly inside explicit `onOpenChange` event handlers during open state transitions, eliminating render-phase side-effects.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] Remove inline `resetFormValues` calls and `if (open !== prevOpen)` render-phase state checks from `PersonalTransactionDrawer.tsx`.
- [x] Remove inline `resetFormValues` calls and `if (open !== prevOpen)` render-phase state checks from `BusinessTransactionDrawer.tsx`.
- [x] Trigger form state reset strictly inside `onOpenChange` callbacks when opening the drawer or changing selection.
- [x] Verify drawer open and edit interactions operate without side-effects during render.
