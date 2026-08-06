Status: ready-for-agent

## Problem Statement

The initial implementation of the automated recurring transactions generator (Issue #10) introduced essential functionality but exposed several edge-case reliability, state-scoping, date calculation, and code quality issues:

1. **Circuit Breaker Scope Bleed**: Updating any metadata field (such as `name` or `note`) automatically resets the circuit breaker's `failureCount` and `lastFailureReason` to clean state, even if the rule failed due to underlying database or account issues.
2. **Implicit Active State Forcing**: Submitting an edit in `RecurringTransactionDrawer` forcibly appends `active: true`, automatically re-activating paused rules without explicit user confirmation to resume.
3. **Calendar Mode Month Jump Drift**: `calculateNextRunDate()` increments months relative to `currentDate` rather than computing month offsets anchored to the original `startDate` day, causing potential day-of-month drift over multi-month catch-up loops or short month transitions.
4. **Silent Error Suppression**: Errors during session catch-up in `getRecurringTransactions()` are swallowed silently without logging or error telemetry.
5. **Form State Code Smells**: `RecurringTransactionDrawer.tsx` contains duplicated form initialization code across `useForm` `defaultValues` and `useEffect` reset hooks, as well as an unsafe `'' as unknown as number` type assertion hack for empty numeric fields.

## Solution

Harden the recurring transactions generator, refine circuit breaker state management, improve calendar date math, log catch-up errors, and refactor drawer form handling:

1. **Explicit Circuit Breaker Resets**: Modify `updateRecurringTransaction()` so `failureCount` and `lastFailureReason` are reset ONLY when `active: true` is explicitly passed (e.g., when the user clicks "Resume" or explicitly toggles active state).
2. **Preserve Active State on Edit**: Update `RecurringTransactionDrawer.tsx` to preserve the rule's current `active` state during edit submissions instead of hardcoding `active: true`.
3. **Anchored Calendar Date Calculation**: Refine `calculateNextRunDate()` for `CALENDAR` mode to compute next run dates anchored to the target day of month from `startDate`.
4. **Structured Catch-up Logging**: Replace empty `catch` blocks in `getRecurringTransactions()` session catch-up with structured console warnings logging error details.
5. **Clean Form State & Type Coercion**: Refactor `RecurringTransactionDrawer.tsx` to extract form default mapping into a helper function and use proper numeric handling without unsafe type assertions.

## User Stories

1. As a user, I want paused recurring transaction rules to remain paused when I edit their name or note, so that broken or paused rules do not unexpectedly run.
2. As a user, I want explicit control over resuming a paused recurring transaction, so that I can fix underlying issues before re-activating the rule.
3. As a user, I want monthly subscriptions set for the 31st of every month to consistently run on the last day of short months and snap back to the 31st for 31-day months, so that my subscription schedule never drifts.
4. As a developer, I want session catch-up errors logged cleanly with context, so that execution failures can be diagnosed without crashing user views.
5. As a developer, I want clean type-safe form defaults in UI drawers without duplicate mapping or unsafe type assertions, so that the codebase remains maintainable and robust.

## Implementation Decisions

- **Circuit Breaker Scoping**:
  - `updateRecurringTransaction()` only updates `failureCount = 0` and `lastFailureReason = null` when `data.active === true`.
  - Field updates (`name`, `amount`, `note`, `schedule_mode`, etc.) without `active: true` retain existing circuit breaker failure telemetry.
- **Drawer Active State**:
  - `RecurringTransactionDrawer.tsx` passes `active: initialData ? initialData.active : true` on update, unless user explicitly resumes via the "Resume" action button.
- **Date Math Anchoring**:
  - In `calculateNextRunDate()`, `CALENDAR` mode calculates month additions from `currentDate` while guaranteeing target day alignment with `startDate.getDate()`.
- **Catch-up Logging**:
  - Catch block in `getRecurringTransactions()` logs `console.warn('[Recurring Catch-up Error]:', err)` instead of swallowing exceptions silently.
- **Form State Mapping**:
  - Extract `getFormDefaults(initialData)` helper in `RecurringTransactionDrawer.tsx` to unify `useForm` defaults and `useEffect` reset state.
  - Replace `'' as unknown as number` with standard Zod `z.number().or(z.nan())` or optional numeric transform pattern.

## Testing Decisions

- **Testing Seams**:
  - Primary Seams: `calculateNextRunDate()`, `processDueRecurringTransactions()`, `updateRecurringTransaction()` in `src/lib/actions/recurring.ts`.
  - Secondary Seams: `RecurringTransactionDrawer` and `RecurringTransactionsList` component tests.
- **Testing Coverage**:
  - Unit tests for `updateRecurringTransaction()` preserving `failureCount` / `lastFailureReason` when `active` is omitted.
  - Unit tests for `updateRecurringTransaction()` resetting `failureCount` when `active: true` is passed.
  - Unit tests for date math edge cases across short months and leap years.
  - Component tests for `RecurringTransactionDrawer` form reset and edit state submission.

## Out of Scope

- Changing database schema columns.
- Altering the cron endpoint authentication mechanism (`CRON_SECRET` bearer token).
