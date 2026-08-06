# Feature Spec: Base UI Component Migration & New Primitive Integration

**Status:** `ready-for-agent`

---

## Problem Statement

Following the upgrade to upstream `shadcn/ui` with `@base-ui/react` primitives (`base-luma` style), LedgerFlow has upgraded its core component wrappers. However, legacy radix-style event props (such as `onInteractOutside`), invalid `asChild` props on Base UI wrappers, legacy `sonner` toast notifications, and upstream data attribute regressions (`data-[state=...]`) still linger across application views. Furthermore, newly introduced components—specifically `@base-ui/react/toast` and `@shadcn/react/questionnaire`—need to be fully leveraged across LedgerFlow's domain workflows (Workspace Mode switching, Personal vs. Business onboarding, and Identity Reconciliation for Ghost Members and Unregistered Contacts).

---

## Solution

1. **Complete Base UI Refactoring**: Audit and eliminate all remaining Radix-specific patterns across application code—replacing `asChild` with `render` props on Base UI wrappers (Popover, Sheet, DropdownMenu, AlertDialog), replacing `onInteractOutside` with Base UI modal/dismissible controls, and enforcing Base UI boolean attributes (`data-selected`, `data-pressed`, `data-open`, `data-collapsed`).
2. **Unified Base UI Toast Notification Engine**: Replace all legacy `sonner` notifications across forms, drawers, auth flows, and transaction actions with `@base-ui/react/toast` (`toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()`, `toast.loading()`).
3. **Domain-Driven Questionnaire Wizards**: Leverage `questionnaire.tsx` to power multi-step domain flows:
   - **Onboarding Wizard**: Guiding new users through Personal vs. Business Workspace Mode selection, Theme & Accent styling, and default currency settings.
   - **Identity Reconciliation Wizard**: Guiding users through merging Unregistered Contacts and claiming Ghost Member records in shared Group Ledgers.
4. **Layout & Provider Standardization**: Ensure `<TooltipProvider>` and Base UI `<Toaster />` cleanly wrap the entire application in the root layout.

---

## User Stories

1. As a Registered Profile, I want all toast notifications (e.g. transaction updates, settled expenses, mode switches) to appear via the native Base UI Toast system so that feedback is consistent, accessible, and responsive.
2. As a Registered Profile onboarding to LedgerFlow, I want a step-by-step Questionnaire wizard to choose my primary Workspace Mode (Personal or Business), accent color, and currency so that my workspace is tailored to my financial needs.
3. As a Registered Profile adding external members to a group, I want a guided Questionnaire wizard during identity reconciliation so that I can merge Unregistered Contacts into linked Ghost Members without administrative errors.
4. As a mobile app user, I want the Mobile Sidebar sheet to open and close smoothly without legacy Radix trigger warnings so that navigation feels fluid.
5. As a Business Mode user, I want the Business Switcher popover to trigger via Base UI `render` prop so that popover positioning and focus management work reliably.
6. As a Personal Mode user managing budget categories, I want category dropdown menus to open crisply via Base UI `render` triggers so that options are accessible via keyboard navigation.
7. As a group admin, I want group settings dialogs and confirmation alerts to use Base UI modal triggers so that background backdrop clicks and escape keys act predictably.
8. As a financial manager viewing budget cards, I want progress indicators to display dynamic status colors via `indicatorClassName` so that I can visually gauge spending thresholds.
9. As a user navigating tables, I want selected table rows to highlight using `data-selected` attributes so that active data is clearly visible across light and dark themes.
10. As a user toggling view modes, I want toggle groups to react to `data-pressed` states so that active filters are visually distinct.
11. As a user expanding or collapsing the main application sidebar, I want sidebar rails and insets to transition smoothly using `data-collapsed` state selectors so that workspace real estate is maximized.
12. As a user inspecting UI elements, I want tooltips to display after a brief delay using `data-open` animations so that contextual help is unobtrusive.

---

## Implementation Decisions

### 1. Component Overwrite & Attribute Standardization
- Enforce strict Base UI boolean attributes (`data-selected`, `data-pressed`, `data-collapsed`, `data-open`) across `table.tsx`, `toggle-group.tsx`, `sidebar.tsx`, and `tooltip.tsx`.
- Maintain `indicatorClassName` on `Progress` in `progress.tsx` to support dynamic budget status styling in `BudgetCard.tsx`.

### 2. Toast Notification Engine Migration
- All application-level imports of `sonner` (`import { toast } from "sonner"`) will be migrated to `import { toast } from "@/components/ui/toast"`.
- Legacy alert calls across Auth, Personal Transaction Drawer, Business Transaction Drawer, Split Expense Drawer, Settle Up Drawer, and Group Settings will use typed helper functions:
  - `toast.success(title, { description })` for completed transactions, contact merges, and settings saves.
  - `toast.error(title, { description })` for validation and API failures.
  - `toast.loading(title)` for async operations (e.g. processing bulk settlement).

### 3. Questionnaire Domain Integration
- `Questionnaire` primitive will be used to construct:
  - `OnboardingWizard`: Form step-flow with choices for Workspace Mode (Personal vs Business), default accent palette, and primary currency.
  - `ContactReconciliationWizard`: Step-flow allowing users to select an Unregistered Contact, match by verified phone/email, and claim corresponding Ghost Member entries in group ledgers.

### 4. Radix API Cleanup
- Audit `OnboardingModal.tsx`: Replace `onInteractOutside={(e) => e.preventDefault()}` with Base UI `dismissible={false}` or `modal={true}` on `Dialog`.
- Audit all `asChild` occurrences on Base UI wrappers (`PopoverTrigger`, `AlertDialogTrigger`, `SheetTrigger`, `DropdownMenuTrigger` in `GroupSettingsDrawer.tsx`, `MobileSidebar.tsx`, `BusinessSwitcher.tsx`, `categories/page.tsx`, `ledger/[contactId]/page.tsx`, `friends/[contactId]/page.tsx`, `date-time-picker.tsx`) and convert to `render={<Button ... />}` syntax.
- Retain `asChild` exclusively on `Drawer*` wrappers backed by `vaul`.

---

## Testing Decisions

### Philosophy
Tests will validate external user-perceivable behaviors, keyboard accessibility, ARIA compliance, and state transitions—never internal component implementation details.

### Target Modules & Test Suites
- **E2E Test Suite (`pnpm test:e2e`)**:
  - Test toast triggers during transaction creation, expense settlement, and workspace mode switching.
  - Test onboarding questionnaire flow completion and preference persistence.
  - Test drawer/dialog/popover openings, keyboard focus traps, and escape key dismissals.
- **Unit & Integration Suite (`pnpm test`)**:
  - Test `toast` manager state updates and queue behavior.
  - Test questionnaire choice selections, step navigation, and submit callbacks.
  - Test Base UI data attribute styling matches (`data-selected`, `data-pressed`, `data-open`).
- **Static Verification**:
  - `pnpm exec tsc --noEmit` must return 0 errors.
  - `pnpm run build` must produce a clean Next.js production build.
  - `grep -rn "@radix-ui" src/` must confirm zero `@radix-ui` imports outside `form.tsx`.

---

## Out of Scope

- Migrating `vaul` (`Drawer`) internal Radix primitives (since `vaul` handles its own underlying primitives).
- Re-styling non-shadcn third-party charts or date pickers.
- Modifying database schemas or backend API contracts.

---

## Further Notes

- All changes adhere strictly to the project's ubiquitous domain language defined in `CONTEXT.md` (Personal Mode, Business Mode, Workspace Mode, Registered Profile, Unregistered Contact, Ghost Member, Identity Reconciliation).
