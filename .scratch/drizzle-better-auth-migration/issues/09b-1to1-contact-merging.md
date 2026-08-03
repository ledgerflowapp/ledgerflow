# 09b — 1:1 Direct Contact Merging & Friendship Linking

Category: enhancement
Status: ready-for-agent
Blocked by: 09a

## Description
Implement direct 1:1 contact merging into registered user profiles, auto-creating `ACCEPTED` friendships and re-linking contact balance and metadata within an atomic Drizzle database transaction.

## Detailed Requirements

### 1. 1:1 Contact Merging & Metadata Preservation
- Server action `mergeContactToUserProfile(contactId, targetUserId)` using guards from 09a.
- Update target contact: `contacts.linkedUserId = targetUserId` while preserving local custom contact name, notes, and 1:1 `netBalance`.
- Ensure contact invite links explicitly state that accepting connects the recipient as a friend with the inviter.

### 2. Friendship Auto-creation
- Automatically insert or accept a `friendships` record (`status = 'ACCEPTED'`) between contact owner/inviter and `targetUserId`.

### 3. Atomic Drizzle Transaction & Audit
- Execute all updates inside `db.transaction(async (tx) => ...)`.
- Emit in-app audit notification (`notifications` table) to contact owner upon merge completion.

## Acceptance Criteria
- [ ] Server action `mergeContactToUserProfile(contactId, targetUserId)` implemented in `src/lib/actions/contacts.ts`.
- [ ] Target contact linked (`linkedUserId = targetUserId`) without wiping local custom notes, custom names, or net balance.
- [ ] `ACCEPTED` friendship auto-created between inviter and target user.
- [ ] Contact invite link copy/prompt explicitly states friendship connection upon acceptance.
- [ ] Executed within an atomic Drizzle `db.transaction(...)`.
- [ ] In-app audit notification emitted to contact owner upon completion.
- [ ] Unit tests added in `src/lib/actions/__tests__/contacts-merge.test.ts`.

## Comments
> *Split from original combined issue 09 to isolate 1:1 contact linking and friendship creation.*
