# 03 — Radix API & Attribute Cleanup Across UI Wrappers and Views

**What to build:**
Complete audit and elimination of legacy Radix props (`asChild`, `onInteractOutside`) on Base UI-backed wrappers across navigation menus, sheets, drawers, popovers, and dialogs, enforcing Base UI `render` props and boolean data attributes.

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] All invalid `asChild` uses on Base UI-backed triggers (`PopoverTrigger`, `AlertDialogTrigger`, `SheetTrigger`, `DropdownMenuTrigger`) are replaced with `render={<Button ... />}` syntax across `GroupSettingsDrawer.tsx`, `MobileSidebar.tsx`, `BusinessSwitcher.tsx`, categories page, and date/time pickers.
- [x] `onInteractOutside` in `OnboardingModal.tsx` is replaced with Base UI `disablePointerDismissal={true}` / `modal={true}` configuration.
- [x] Valid `asChild` uses on `vaul`-backed `Drawer*` components remain intact.
- [x] All UI components cleanly compile without TypeScript warnings or invalid Radix DOM attribute warnings.
- [x] `grep -rn "@radix-ui" src/` confirms zero `@radix-ui` imports outside `form.tsx`.
