# 09c — Token-Based Group Ghost Member Claiming

Category: enhancement
Status: completed
Blocked by: 09b

## Description
Implement immediate token-based claiming for group ghost members when an unregistered user registers or claims via an explicit group or contact `inviteToken`.

## Detailed Requirements

### 1. Token-Based Claiming Logic
- Server action `claimGroupGhostMemberByToken(inviteToken, targetUserId)`.
- Locate ghost member record associated with `inviteToken`.
- Set `group_members.userId = targetUserId` and clear `ghostName`.
- Bulk re-assign all associated `transaction_splits.userId = targetUserId` for that ghost member slot immediately.

### 2. Atomic Transaction & Notifications
- Execute updates inside an atomic `db.transaction(async (tx) => ...)`.
- Emit in-app notifications to claimer and group admin upon claim completion.

## Acceptance Criteria
- [x] Server action `claimGroupGhostMemberByToken(inviteToken, targetUserId)` implemented in `src/lib/actions/groups.ts`.
- [x] Ghost member upgraded to full member (`group_members.userId` set, `ghostName` cleared).
- [x] All past `transaction_splits` re-assigned to `targetUserId` without orphaned records.
- [x] Updates wrapped in atomic `db.transaction(...)`.
- [x] In-app notification emitted to group admin and claimer upon completion.
- [x] Unit tests added in `src/lib/actions/__tests__/group-ghost-token-claim.test.ts`.

## Comments
> *Split from original combined issue 09 to isolate token-based group ghost member claiming.*
