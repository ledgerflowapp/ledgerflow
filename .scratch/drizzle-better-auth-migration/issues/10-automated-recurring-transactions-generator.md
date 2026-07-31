# 10 — Automated Generation of Scheduled Recurring Transactions

Category: enhancement
Status: ready-for-agent

## Description
User Story 8 in `spec.md` specifies automatic generation of due recurring transactions. Currently `src/lib/actions/recurring.ts` provides manual CRUD actions only.

## Requirements
- Create `processDueRecurringTransactions()` in `src/lib/actions/recurring.ts` with optional `userId` filter for session catch-up.
- Add route handler `POST /api/cron/recurring` protected by `CRON_SECRET` Bearer auth for scheduled background processing.
- Implement incremental catch-up loop (capped at max 50 iterations per rule) where each occurrence commits in an atomic DB transaction.
- Add `scheduleMode` (`"CALENDAR"` | `"FIXED_INTERVAL"`, default `"CALENDAR"`) column to `recurring_transactions` and expose UI toggle with intuitive descriptions and examples.
- Implement Circuit Breaker: track `failureCount` and `lastFailureReason` on rules, automatically pausing (`active = false`) rules that hit 3 consecutive execution errors and presenting warning UI.

## Acceptance Criteria
- [ ] Due recurring transactions correctly create ledger transactions on execution.
- [ ] Schedule dates update atomically per occurrence (incremental catch-up idempotency).
- [ ] Hybrid triggering works via `POST /api/cron/recurring` and user session initialization.
- [ ] User can configure `scheduleMode` (`CALENDAR` vs `FIXED_INTERVAL`) on recurring transaction creation/edit.
- [ ] Circuit breaker pauses failing rules after 3 attempts and presents actionable UI feedback.
- [ ] Unit tests added for recurring transaction generator logic, frequency calculations, catch-up limits, and circuit breaker.

## Comments
> *This was updated following a grilling session and recorded in ADR 0001.*
Triaged as `enhancement` / `ready-for-agent`. Completes User Story 8 from migration spec.

