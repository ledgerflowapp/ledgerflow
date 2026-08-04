Status: ready-for-agent

## Problem Statement

When group expense ledgers are created, managers frequently add non-registered participants ("ghost members") identified by display names, phone numbers, or email addresses. When those real-world participants subsequently register a LedgerFlow account or update their profile contact details, their historical expense splits and debt settlements remain tied to disconnected ghost member slots. Manual claiming tokens require out-of-band link sharing, whereas direct automatic account linking without authorization risks exposing sensitive group financial data. Users need an automated, secure background matching engine that detects phone/email matches, dispatches async merge requests to group admins, and executes atomic expense split re-assignments upon admin approval.

## Solution

Implement an automated **Phone/Email Group Ghost Auto-Matching Engine & Admin Approval Workflow**.

When a user registers or updates their contact information, LedgerFlow scans for unlinked group ghost member slots matching their verified phone number or email address. When a match is identified, the system automatically creates a pending `GROUP_GHOST_MERGE_REQUEST` notification for the group administrator (`groups.createdBy`). Group admins can approve or reject the request using single-click server actions (`approveGroupGhostMerge` / `rejectGroupGhostMerge`). Upon approval, an atomic Drizzle database transaction upgrades the group member slot, re-assigns all associated transaction splits and payer records to the target user, clears the ghost display name, and emits audit notifications to all involved parties without data loss or race conditions.

## User Stories

1. As a group expense manager, I want phone/email matching ghost members to generate admin approval requests, so that I maintain full control over who joins my group expense ledger.
2. As a newly registered user, I want the system to automatically detect existing group ghost slots matching my phone number or email, so that I don't have to manually request claim tokens.
3. As a group admin, I want to review incoming ghost merge requests in my notifications feed, so that I can verify the identity of the person claiming the ghost slot.
4. As a group admin, I want to approve a ghost merge request with a single click, so that the user is immediately granted member access to the group.
5. As a group admin, I want all historical expense splits associated with the ghost member to be automatically transferred to the approved user, so that group debt balances remain accurate.
6. As a group admin, I want any transactions paid by the ghost member to update their payer reference to the approved user ID, so that payment history reflects the registered member.
7. As a group admin, I want to reject an invalid merge request, so that unauthorized users cannot gain access to group expense records.
8. As a requesting user, I want to receive an audit notification when my ghost merge request is approved by the admin, so that I know I can view and participate in the group ledger.
9. As a requesting user, I want to receive an audit notification if my ghost merge request is rejected, so that I am informed of the admin's decision.
10. As a group admin, I want merge approval and split re-assignment to execute atomically, so that a database failure never leaves a group member half-linked or balances corrupted.
11. As a developer, I want all authorization checks (verifying group admin identity) enforced server-side inside server actions, so that non-admin users cannot approve merge requests.
12. As a developer, I want duplicate or already-processed merge requests to be rejected idempotently, so that double-approval attempts do not cause database errors.

## Implementation Decisions

- **Auto-Matching Trigger**:
  - Background service (`src/lib/services/ghost-auto-matcher.ts`) executed upon user profile contact updates or sign-up.
  - Queries `group_members` where `userId IS NULL` and `ghostName` or contact metadata matches target user's verified `email` or `phone`.
  - Dispatches `GROUP_GHOST_MERGE_REQUEST` notification to `groups.createdBy`.

- **Server Actions & API Contract (`src/lib/actions/groups.ts`)**:
  - `requestGroupGhostMerge({ groupId, ghostMemberId, targetUserId })`:
    - Validates target user and group existence.
    - Ensures ghost member exists and is unclaimed (`userId IS NULL`).
    - Verifies target user is not already a member.
    - Creates pending notification for group admin.
  - `approveGroupGhostMerge(requestId: string)`:
    - Validates session user is the group admin (`groups.createdBy === sessionUser.id`).
    - Validates request notification state is `PENDING`.
    - Wraps operations in atomic `db.transaction(async (tx) => ...)`:
      1. Re-verifies ghost member availability.
      2. Upgrades `group_members` slot (`userId = targetUserId`, `ghostName = null`, `joinedAt = now()`).
      3. Re-assigns `transaction_splits` (`userId = targetUserId` where `groupMemberId = ghostMemberId`).
      4. Re-assigns `transactions` (`payerId = targetUserId` where `payerGroupMemberId = ghostMemberId`).
      5. Marks notification state as `APPROVED`.
      6. Emits in-app audit notifications to target user and admin.
  - `rejectGroupGhostMerge(requestId: string)`:
    - Validates session user is group admin.
    - Atomically updates notification state to `REJECTED` and emits audit notification without altering group member data.

- **Data Models & Schema**:
  - Uses existing Drizzle schema (`groups`, `groupMembers`, `transactionSplits`, `transactions`, `notifications`).
  - Notification payload structure (`data` JSON field):
    ```ts
    interface GroupGhostMergeRequestData {
      groupId: string;
      ghostMemberId: string;
      targetUserId: string;
      requestingUserId: string;
      status: "PENDING" | "APPROVED" | "REJECTED";
      approvedAt?: string;
      rejectedAt?: string;
    }
    ```

## Testing Decisions

- **Testing Seams**:
  - Primary testing seam is at the Server Actions layer (`src/lib/actions/groups.ts`) and Auto-Matcher service (`src/lib/services/ghost-auto-matcher.ts`).
  - Tests simulate caller sessions using `getSessionUser` mocks and exercise database state updates via mock Drizzle transactions.
- **Testing Principles**:
  - Tests verify end-to-end business behavior: authorization enforcement, atomic data mutations, status updates, and audit notification creation.
  - Avoid testing low-level SQL syntax string formatting.
- **Prior Art**:
  - `src/lib/actions/__tests__/group-ghost-admin-approval.test.ts`
  - `src/lib/actions/__tests__/group-ghost-token-claim.test.ts`
  - `src/lib/actions/__tests__/contacts-merge.test.ts`

## Out of Scope

- Direct auto-merging without group admin approval (all auto-matches require explicit admin consent).
- External SMS / email notification dispatches (uses in-app notification system).
- External contact book sync APIs (e.g., Google Contacts import).

## Further Notes

- Leverages Better Auth for session identification and caller authentication.
- All transactional updates are protected by database foreign keys and Drizzle atomic transaction isolation.
