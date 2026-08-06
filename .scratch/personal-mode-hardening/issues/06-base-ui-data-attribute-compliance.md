# 06 — Base UI Data-Attribute Compliance Refactoring

**What to build:** Core UI primitive components conform to `AGENTS.md` guidelines by replacing legacy Radix `data-[state=...]` selectors with Base UI boolean data attributes (`data-selected`, `data-open`, `data-closed`, `data-collapsed`).

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] `table.tsx` uses `data-selected:bg-muted` boolean attribute instead of `data-[state=selected]`.
- [ ] `tooltip.tsx`, `navigation-menu.tsx`, `sidebar.tsx`, and `attachment.tsx` rely exclusively on Base UI boolean attributes (`data-open`, `data-closed`, `data-collapsed`, `data-error`).
- [ ] UI component unit/visual tests verify clean rendering and state transitions across light and dark themes.
