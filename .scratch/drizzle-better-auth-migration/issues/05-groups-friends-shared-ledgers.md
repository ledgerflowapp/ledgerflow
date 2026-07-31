# 05 — Groups, Friends & Shared Ledgers

**What to build:** End-to-end group expense splitting, member invitations, and friend management using Drizzle ORM Server Actions, replacing `join_group_rpc`, `group_merge_rpc`, and `remove_friend_rpc`.

**Blocked by:** 03 — Personal Transactions & Ledger Actions

**Status:** ready-for-agent

- [x] Group member join, merge, and expense balance RPCs ported to `src/lib/actions/groups.ts` using Drizzle transactions.
- [x] Friend invite, contact invite, and friend removal RPCs ported to `src/lib/actions/friends.ts`.
- [x] Group UI components and friend management hooks refactored to use Server Actions and React Query cache invalidation.
- [x] Contact merging and group balance updates verified working end-to-end.
