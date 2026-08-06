# 03 — Rendering Safety Guards & O(1) Lookup Optimization

**What to build:** Eliminate literal `0` text node rendering when list arrays are empty, and accelerate group member and friend list rendering by replacing O(N * M) nested array searches with `Set` and `Map` index lookups.

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] Convert `items.length && <List />` guards to boolean ternary expressions `items.length > 0 ? <List /> : null` in `AccountsList.tsx` and `GroupsList.tsx`.
- [x] Pre-build `Set` lookup indexes for member IDs in `GroupSettingsDrawer.tsx` to turn O(N * M) `.some()` checks into O(1) `.has()` checks.
- [x] Pre-build `Set` lookups in `SplitExpenseDrawer.tsx` for `selectedMembers.includes()`.
- [x] Cache date parsing results during sort/filter transforms in transaction list components.
- [x] Verify rendering components pass UI tests without text node artifacts.
