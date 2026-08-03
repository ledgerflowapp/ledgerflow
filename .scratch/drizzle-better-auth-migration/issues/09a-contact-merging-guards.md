# 09a — Contact Merging Authorization & Profile Verification Guards

Category: security / enhancement
Status: completed

## Description
Implement and unit-test authorization, ownership, and target profile verification guards for contact merging workflows to prevent account takeover, spoofing, or unauthorized linking.

## Detailed Requirements

### 1. Session Authentication & Caller Restrictions
- Verify active session via `getSessionUser()`.
- Restrict caller: `sessionUser.id` must be either the contact owner (`contact.userId`) or the target registered user (`targetUserId`).

### 2. Validation & Verification Guards
- Disallow self-merging (`contact.userId !== targetUserId`).
- Require `phoneVerified` or `emailVerified` to be `true` on the target profile for any phone/email auto-matching to prevent spoofing.

## Acceptance Criteria
- [x] Guard functions (`validateContactMergeGuards`) implemented in `src/lib/actions/contacts.ts` (or helper `src/lib/actions/contacts-guards.ts`).
- [x] Active session authentication guard enforced (`getSessionUser()`).
- [x] Caller ownership guard verified (`sessionUser.id` must match `contact.userId` or `targetUserId`).
- [x] Self-merge attempt throws explicit authorization error.
- [x] Unverified target profiles (`phoneVerified === false` and `emailVerified === false`) rejected for auto-matching.
- [x] Unit tests added covering all guard scenarios in `src/lib/actions/__tests__/contacts-guards.test.ts`.

## Comments
> *Split from original combined issue 09 to isolate authorization & verification guards.*
