Created At: 2026-08-06T11:43:27+05:30
Completed At: 2026-08-06T11:47:05+05:30
File Path: `file:///home/sahil/Developer/web/experiments/ledgerflow/.scratch/personal-mode-hardening/issues/06-base-ui-data-attribute-compliance.md`

# 06 — Base UI Data-Attribute Compliance Refactoring

**What to build:** Core UI primitive components conform to `AGENTS.md` guidelines by replacing legacy Radix `data-[state=...]` selectors with Base UI boolean data attributes (`data-selected`, `data-open`, `data-closed`, `data-collapsed`).

**Blocked by:** None — can start immediately

**Status:** completed

- [x] `table.tsx` uses `data-selected:bg-muted` boolean attribute instead of `data-[state=selected]`.
- [x] `tooltip.tsx`, `navigation-menu.tsx`, `sidebar.tsx`, and `attachment.tsx` rely exclusively on Base UI boolean attributes (`data-open`, `data-closed`, `data-collapsed`, `data-error`).
- [x] UI component unit/visual tests verify clean rendering and state transitions across light and dark themes.
