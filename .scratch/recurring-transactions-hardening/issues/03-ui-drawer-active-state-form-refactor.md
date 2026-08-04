# 03 — UI Drawer Active State & Clean Form Types

**What to build:**
Update `RecurringTransactionDrawer` to preserve the rule's current `active` state during metadata edits instead of hardcoding `active: true`. Refactor `RecurringTransactionDrawer` to unify form default values using a helper function and remove unsafe type assertion hacks like `'' as unknown as number`.

**Blocked by:** 01 — Circuit Breaker Scoping & Resume State Handling, 02 — Calendar Date Anchoring & Catch-Up Telemetry.

**Status:** completed

- [x] `RecurringTransactionDrawer` preserves the existing `active` state when saving rule edits.
- [x] Form defaults and reset logic in `RecurringTransactionDrawer` are unified into a single helper function.
- [x] Unsafe `'' as unknown as number` type assertion is replaced with clean numeric form handling.
- [x] UI component tests pass and confirm drawer edit behavior.
