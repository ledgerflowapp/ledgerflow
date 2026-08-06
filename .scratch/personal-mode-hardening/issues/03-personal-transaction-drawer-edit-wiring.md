# 03 — Personal Transaction Drawer UI Edit Wiring

**What to build:** Users can edit existing transactions directly from the transaction detail drawer, opening the transaction drawer pre-populated with existing record attributes and saving changes end-to-end.

**Blocked by:** 02 — Atomic Balance Adjustments on Transaction Edit & Soft-Delete

**Status:** ready-for-agent

- [ ] `onEdit` callback in `PersonalTransactionList` opens `PersonalTransactionDrawer` in edit mode with pre-populated amount, date, account, category, notes, and person associations.
- [ ] Submitting the edit drawer invokes `updateTransactionAction` and refreshes personal transaction lists and account balances in the UI.
- [ ] UI integration tests verify that editing a transaction updates the transaction display and reflects balance changes without full page reloads.
