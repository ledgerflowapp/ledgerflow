# 04 — Aggregated Personal Notification Feed Query

**What to build:** The Personal Mode notification feed displays all social and activity alerts including friend requests, group invitations, and shared expense additions alongside ghost merge requests.

**Blocked by:** None — can start immediately

**Status:** completed

- [x] `getNotificationsAction` queries and aggregates `FRIEND_REQ`, `GROUP_INVITE`, `EXPENSE_ADDED`, and `GROUP_GHOST_MERGE_REQUEST` notification records for the authenticated user.
- [x] Notification feed UI renders appropriate icons, timestamps, and inline action buttons (accept/reject/mark as read) for each notification type.
- [x] Integration tests verify notification retrieval and state updates across all personal notification types.

