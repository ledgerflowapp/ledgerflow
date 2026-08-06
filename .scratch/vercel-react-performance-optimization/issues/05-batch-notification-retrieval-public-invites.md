# 05 — Batch Notification Retrieval & Public Invite Security

**What to build:** Notification feeds load instantly in a single batch database query (eliminating N+1 query loops) while preserving public preview access for unauthenticated users arriving from WhatsApp group invite links.

**Blocked by:** 04 — Server Action Parallelization & Atomic Balance Updates

**Status:** completed

- [x] Refactor `getNotificationsAction()` in `src/lib/actions/notifications.ts` to replace the `for...of` query loop with a bulk batch query (`inArray()`).
- [x] Retain public preview availability on `getGroupByInviteAction(inviteCode)` in `src/lib/actions/groups.ts` for unauthenticated visitors.
- [x] Enforce strict authentication check (`getSessionUser()`) inside `joinGroupAction()` in `src/lib/actions/groups.ts`.
- [x] Verify notification feed loads accurately and group invite link flow functions properly for non-account holders.
