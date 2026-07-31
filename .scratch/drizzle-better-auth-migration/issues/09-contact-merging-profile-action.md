# 09 — Implement Contact Merging into Registered Profiles

Category: enhancement
Status: ready-for-agent

## Description
User Story 7 in `spec.md` requires merging duplicate unregistered contacts and group ghost members into newly registered user profiles, transferring and re-linking past transaction history, friend ledgers, and group splits without data loss or security vulnerabilities.

## Detailed Requirements

### 1. Authorization & Validation Guards
- Verify active session (`getSessionUser()`).
- Restrict caller: `sessionUser.id` must be either the contact owner (`contact.userId`) or the target registered user (`targetUserId`).
- Disallow self-merging (`contact.userId !== targetUserId`).
- Require `phoneVerified` or `emailVerified` to be `true` on the target profile for any phone/email auto-matching to prevent spoofing.

### 2. 1:1 Contact Merging & Friendships
- Update target contact: `contacts.linkedUserId = targetUserId` while preserving local custom contact name, notes, and 1:1 `netBalance`.
- Automatically insert or accept a `friendships` record (`status = 'ACCEPTED'`) between the contact owner/inviter and `targetUserId`.
- Ensure contact invite links explicitly state that accepting connects the recipient as a friend with the inviter.

### 3. Group Ghost Member Claiming & Admin Approval
- **Token-based Claiming:** When an unregistered user registers/claims via an explicit group or contact `inviteToken`, set `group_members.userId = targetUserId`, clear `ghostName`, and update associated `transaction_splits.userId = targetUserId` immediately.
- **Phone/Email Auto-matching:** When matched via phone/email, dispatch a merge request notification to the group admin (`groups.createdBy`) for approval before finalizing the `group_members` link and split re-assignment.

### 4. Transactions & Bulk Operations
- Execute all matching updates via set-based bulk SQL queries within a single Drizzle database transaction (`db.transaction(async (tx) => ...)`).
- Emit in-app audit notifications (`notifications` table) to contact owners and group admins upon merge completion or merge request.

## Acceptance Criteria
- [ ] Server action `mergeContactToUserProfile(contactId, targetUserId)` implemented in `src/lib/actions/contacts.ts` protected by session auth & ownership guards.
- [ ] Verification guard enforced for phone/email auto-matching (`phoneVerified`/`emailVerified`).
- [ ] Direct 1:1 contact linked (`linkedUserId`) with `ACCEPTED` friendship auto-created.
- [ ] Token-based ghost member claiming and phone/email group admin approval workflow implemented.
- [ ] Transaction history and splits correctly re-linked without orphaned records.
- [ ] In-app notifications emitted to contact owners and group admins.
- [ ] Unit tests added in `src/lib/actions/__tests__/contacts.test.ts` covering direct merge, auto-matching, admin approval, and invite token workflows.

## Comments
> *Refined following domain modeling and grilling session.*
Refined requirements for production security (verification guard), deterministic matching, group admin approval for phone/email ghost member merges, and atomic Drizzle transaction handling. Completes User Story 7 from migration spec.

