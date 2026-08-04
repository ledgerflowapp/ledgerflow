# 01 — Circuit Breaker Scoping & Resume State Handling

**What to build:**
Update `updateRecurringTransaction()` in server actions so that updating metadata fields (like name, amount, category, note) preserves existing circuit breaker state (`failureCount` and `lastFailureReason`). The circuit breaker telemetry is only reset to zero/null when `active: true` is explicitly provided in the update payload (e.g. when resuming a paused rule).

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] `updateRecurringTransaction` retains existing `failureCount` and `lastFailureReason` when `active` is not passed in the update payload.
- [x] `updateRecurringTransaction` resets `failureCount` to 0 and `lastFailureReason` to null when `active: true` is explicitly passed.
- [x] Server action unit tests added to verify circuit breaker retention vs. reset behavior.
