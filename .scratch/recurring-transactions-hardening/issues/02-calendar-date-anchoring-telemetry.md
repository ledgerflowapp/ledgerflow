# 02 — Calendar Date Anchoring & Catch-Up Telemetry

**What to build:**
Refine `calculateNextRunDate()` for `CALENDAR` mode so that month and year jumps calculate target days relative to the rule's original `startDate` anchor. Replace silent empty `catch (e) {}` blocks during session catch-up in `getRecurringTransactions()` with structured logging to capture unexpected errors without breaking user page rendering.

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] `calculateNextRunDate` in `CALENDAR` mode accurately calculates next run dates anchored to target day of month from `startDate`.
- [x] Session catch-up error handling logs execution failures with console warnings instead of silent empty catch blocks.
- [x] Unit tests added for multi-month catch-up date math and catch-up telemetry logging.
