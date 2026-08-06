# 05 — Contact Action Guard Refactoring & Explicit Error Propagation

**What to build:** Contact management server actions enforce explicit authorization checks and raise clear error responses or exceptions on failures, eliminating swallowed `undefined` returns and redundant middle-man wrapper functions.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] `deleteContact` throws an explicit authorization/Not Found error when a contact deletion fails or the contact is not owned by the user.
- [ ] `validateContactMergeGuards` wrapper is replaced by direct invocation of `validateGuards` from `contacts-guards`.
- [ ] Server action unit tests verify that unauthorized or invalid contact actions return appropriate error objects or throw expected errors.
