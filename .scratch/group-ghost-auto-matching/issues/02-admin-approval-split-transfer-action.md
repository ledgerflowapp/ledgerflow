# 02 — Group Admin Approval & Atomic Split Transfer Server Action

**What to build:** Server action `approveGroupGhostMerge(requestId)` that validates the caller is the group admin (`groups.createdBy`), upgrades the group ghost member slot (`userId = targetUserId`, `ghostName = null`), re-assigns all associated `transaction_splits` and payer references to the target user within an atomic `db.transaction(...)`, updates the merge request status to `APPROVED`, and emits audit notifications.

**Blocked by:** 01 — Auto-Matching Detector & Notification Dispatch Service

**Status:** ready-for-agent

- [ ] `approveGroupGhostMerge(requestId)` verifies session user is group admin (`groups.createdBy === sessionUser.id`).
- [ ] Atomic `db.transaction(...)` upgrades `group_members` slot, re-assigns `transaction_splits` and payer references.
- [ ] Merge request notification state updated to `APPROVED` idempotently.
- [ ] In-app audit notifications emitted to target user and admin upon successful approval.
- [ ] Unit tests added for authorization guards, transactional split re-assignments, and failure rollbacks.
