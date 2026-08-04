# 04 — Group Admin In-App Notification Feed & Merge Request Approval UI

**What to build:** In-app notification card UI in the group admin's notification feed for pending `GROUP_GHOST_MERGE_REQUEST` items, rendering single-click "Approve" and "Reject" action buttons connected to server actions `approveGroupGhostMerge` and `rejectGroupGhostMerge` with optimistic UI updates and toast feedback (`sonner`).

**Blocked by:** 02 — Group Admin Approval & Atomic Split Transfer Server Action, 03 — Group Admin Rejection Server Action

**Status:** completed

- [x] Notification feed renders pending group ghost merge request cards for group admins.
- [x] Includes group name, ghost member display name, target user profile info, and "Approve" / "Reject" buttons.
- [x] Invokes `approveGroupGhostMerge` and `rejectGroupGhostMerge` server actions with optimistic UI state transitions.
- [x] Displays success/error toast notifications via `sonner`.
- [x] Unit/UI component tests added for card rendering and action button interactions.

