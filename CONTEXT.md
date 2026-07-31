# LedgerFlow Domain Glossary

## Core Concepts

### Unregistered Contact
A record in the `contacts` table created by a registered user to track 1:1 transactions, IOUs, or balances with an external person who does not yet have a LedgerFlow account. An unregistered contact has `linkedUserId` set to `null`.

### Registered Profile
An authenticated user in LedgerFlow with an active `user` record and associated `profile`.

### Ghost Member
A member of a `group` who was added before registering for LedgerFlow. Represented in `group_members` with `userId` set to `null` and a `ghostName` string.

### Contact Merging
The process of linking one or more `Unregistered Contact` entries (and/or `Ghost Member` records) to a newly registered or existing `Registered Profile`. Once merged:
- **Verification Guard:** Auto-matching by phone/email requires `phoneVerified` or `emailVerified` to be `true` on the target user profile to prevent spoofing.
- **Deterministic Matching:** Matching is strictly performed using unique `inviteToken` or verified `phone`/`email` (fuzzy name-only matching is excluded).
- **1:1 Contacts Auto-Link:** Every `contacts` entry matching the target user's verified phone/email (or specified by invite token/ID) sets `linkedUserId = targetUserId`.
- **Group Ghost Member Claiming & Admin Approval:**
  - If claimed via an explicit invite link token, `group_members` immediately sets `userId = targetUserId` and clears `ghostName`.
  - If matched via phone/email, a merge request notification is sent to the group admin (`groups.createdBy`) for approval before completing the group member link and split re-assignment.
- **Transaction Splits Re-linking:** Past transaction splits in `transaction_splits` tied to claimed ghost members are assigned `userId = targetUserId` upon approval/linking.
- **Friendship Auto-Creation:** Friendships between merging users and the target user profile are automatically established (`ACCEPTED` status) if not already existing.
- **Invite Link Copy:** Contact invite links explicitly state that accepting connects the recipient as a friend with the inviter.
- **Audit & Performance:** All matching updates execute via set-based bulk SQL queries within a single Drizzle transaction, and in-app notifications are emitted to contact owners and group admins.

