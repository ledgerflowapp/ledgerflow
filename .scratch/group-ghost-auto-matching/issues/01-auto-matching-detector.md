# 01 — Auto-Matching Detector & Notification Dispatch Service

**What to build:** Background matching service that triggers upon user registration or profile contact info updates (phone/email), scans for unclaimed group ghost member slots (`userId IS NULL`) matching the contact details, and automatically dispatches a pending `GROUP_GHOST_MERGE_REQUEST` notification to the group admin (`groups.createdBy`).

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Auto-matching detector scans group member ghost slots where `userId IS NULL` matching verified target user phone or email.
- [ ] Automatically dispatches pending `GROUP_GHOST_MERGE_REQUEST` notification to `groups.createdBy`.
- [ ] Emits `GROUP_GHOST_MERGE_REQUEST_SENT` audit notification to requesting target user.
- [ ] Unit tests added for matching logic, contact evaluation, and notification payload structure.
