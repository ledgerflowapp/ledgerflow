# 01 — Base UI Toast Engine Expansion & Root Layout Setup

**What to build:**
A fully mounted Base UI Toast notification engine and Tooltip provider in the root application layout, complete with typed helper utilities (`toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()`, `toast.loading()`) to power all application-wide feedback.

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] `TooltipProvider` and Base UI `Toaster` are mounted cleanly in `src/app/layout.tsx`.
- [x] `src/components/ui/toast.tsx` exports typed helper functions (`toast.success`, `toast.error`, `toast.info`, `toast.warning`, `toast.loading`).
- [x] Toast viewports render with smooth entry/exit animations, swipe dismissals, and high z-index overlays across light and dark themes.
- [x] `pnpm exec tsc --noEmit` and `pnpm run build` pass cleanly.
