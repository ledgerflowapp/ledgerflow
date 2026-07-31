# Domain Glossary & Context

### User & Session Terms

- **Session User**: The authenticated user identity bound to the current incoming request session headers.
- **Server Action Auth Guard**: The mandatory authentication check evaluated at the entry point of every Server Action to guarantee that an operation is performed exclusively on behalf of an authenticated Session User.
- **Ghost Member**: A non-registered user placeholder within a shared group before linking or claiming a profile.

### Recurring Transaction Terms

- **Due Recurring Rule**: An active recurring transaction definition (`active = true`) whose scheduled `next_run_date` is less than or equal to the current execution timestamp (`NOW()`).
- **Recurring Transaction Processor**: The idempotent execution mechanism responsible for converting Due Recurring Rules into concrete financial transaction ledger entries and advancing the rule's `next_run_date`.
- **Schedule Alignment Mode**: A user-selectable strategy for calculating the next execution date when frequency is MONTHLY or YEARLY:
  - `CALENDAR` (Default): Aligns to the same calendar day (e.g., 31st of every month, clamped to 28/29th in Feb).
  - `FIXED_INTERVAL`: Uses exact fixed day spans (+30 days for MONTHLY, +365 days for YEARLY).
- **Incremental Catch-Up Idempotency**: Atomic state progression where each individual catch-up step (generating 1 transaction + advancing `next_run_date`) commits independently. If step 3 of 5 fails, steps 1 and 2 remain safely committed and the processor resumes from step 3 on retry without duplicate entries.
- **Rule Failure Circuit Breaker**: Resiliency mechanism that tracks consecutive execution failures per rule. Upon reaching a failure threshold (e.g., 3 consecutive failures), the rule is flagged/paused to prevent system degradation and requires explicit user review/resume.



