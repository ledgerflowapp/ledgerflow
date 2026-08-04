# 03 — Group Admin Rejection Server Action

**What to build:** Server action `rejectGroupGhostMerge(requestId)` that validates caller is the group admin (`groups.createdBy`), marks the pending merge request notification status as `REJECTED`, and dispatches audit notifications to the requesting user and admin without altering group member slots or ledger transaction splits.

**Blocked by:** 01 — Auto-Matching Detector & Notification Dispatch Service

**Status:** completed

- [x] `rejectGroupGhostMerge(requestId)` verifies caller is group admin.
- [x] Updates notification state to `REJECTED` idempotently.
- [x] Dispatches `GROUP_GHOST_MERGE_REJECTED` audit notification to target user and admin.
- [x] Group member slots and `transaction_splits` remain completely untouched.
- [x] Unit tests added for rejection authorization, idempotency, and data immutability.
