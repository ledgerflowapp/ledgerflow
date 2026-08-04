# 09d — Phone/Email Group Ghost Auto-Matching & Admin Approval Workflow

Category: enhancement
Status: completed
Blocked by: 09c

## Description
Implement the asynchronous admin approval workflow for phone/email auto-matched group ghost members, requiring group admin approval before finalizing member links and split re-assignments.

## Detailed Requirements

### 1. Auto-matching & Notification Dispatch
- When matched via phone/email without an explicit token, dispatch a merge request notification to the group admin (`groups.createdBy`).

### 2. Admin Approval & Rejection Server Actions
- `approveGroupGhostMerge(requestId)`:
  - Validates caller is group admin (`groups.createdBy`).
  - Finalizes `group_members.userId = targetUserId`, clears `ghostName`, and re-assigns `transaction_splits.userId = targetUserId` inside `db.transaction(...)`.
- `rejectGroupGhostMerge(requestId)`:
  - Validates caller is group admin.
  - Marks request as rejected and notifies requesting user without altering group member state.

### 3. Atomic Transaction & Audit
- Execute final member link and split re-assignments inside an atomic `db.transaction(...)`.
- Audit notifications sent to group admin and requesting user upon request, approval, and rejection.

## Acceptance Criteria
- [x] Phone/email auto-match dispatches merge request notification to group admin (`groups.createdBy`).
- [x] Server actions `approveGroupGhostMerge(requestId)` and `rejectGroupGhostMerge(requestId)` implemented in `src/lib/actions/groups.ts`.
- [x] Group member slot and `transaction_splits` updated only after admin approval inside `db.transaction(...)`.
- [x] Rejection path handles request state cleanly without mutating group member data.
- [x] In-app audit notifications emitted upon request, approval, and rejection.
- [x] Unit tests added in `src/lib/actions/__tests__/group-ghost-admin-approval.test.ts`.

## Comments
> *Split from original combined issue 09 to isolate phone/email group ghost auto-matching & admin approval.*
