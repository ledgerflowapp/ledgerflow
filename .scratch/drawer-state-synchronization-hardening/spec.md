# Spec: Render-Purity & Drawer State Synchronization Hardening

Status: ready-for-agent

## Problem Statement

During performance refactoring to eliminate redundant `useEffect` render passes, side-effecting operations (specifically `form.reset()`) were placed directly inside the render scope of key drawer components (`PersonalTransactionDrawer`, `BusinessTransactionDrawer`). In React, calling side-effecting state reset functions directly within render passes violates render purity, risks unstable component lifecycles, can trigger unexpected re-renders or state overwrites, and bypasses standard event callback boundaries. Additionally, form reset state tracking and default account selection logic are duplicated across drawers, and state variables in identity reconciliation wizards use ambiguous naming.

## Solution

Refactor form initialization and state resets across transaction drawers (`PersonalTransactionDrawer`, `BusinessTransactionDrawer`, `SplitExpenseDrawer`, and `ContactReconciliationWizard`) to ensure 100% pure render passes. Form resets will be executed exclusively within explicit event callback handlers (such as `onOpenChange` when opening/closing drawers or explicit selection callbacks) or via key-based component reset patterns. Duplicated default account fallback resolution and open-state form reset logic will be unified into clean, reusable hooks/utilities.

## User Stories

1. As a Personal Mode user opening the personal transaction drawer, I want the form to cleanly initialize with fresh default values or existing transaction data upon opening, so that my transaction inputs are always accurate and free of stale state.
2. As a Business Mode user editing a business transaction, I want the form reset to occur strictly during the drawer open transition, so that intermediate React render passes never clear or corrupt my in-progress inputs.
3. As a group ledger participant opening the split expense drawer, I want default payment accounts and member allocation maps to be derived deterministically, so that split calculations render instantly without extra side-effects.
4. As a user reconciling an Unregistered Contact with a Ghost Member in a group ledger, I want override selections to be clearly named and tracked, so that contact identity merging is predictable and readable.
5. As a developer maintaining LedgerFlow UI drawers, I want all drawer component render functions to be completely side-effect free, so that React Strict Mode and future concurrent rendering features run without warnings or state bugs.

## Implementation Decisions

- **Event-Driven Form Resets**: Move form reset side-effects (`form.reset()`) out of render scope. Trigger form resets strictly inside `onOpenChange(open)` event handlers when transitions occur, or initialize `useForm` default values dynamically using key-based component re-mounting when `initialData` changes.
- **Pure Render Derivations**: Derive default accounts and fallback values directly within render scope as pure computed values (e.g. `defaultAccount = accounts?.find(a => a.is_default) || accounts?.[0]`) without calling mutating state setters during render.
- **Unified Form Reset Pattern**: Encapsulate open-state change detection and form reset triggering into a shared, reusable hook (`useResetFormOnOpen`) to eliminate duplicated `prevOpen`/`prevInitialData` checks across Personal and Business transaction drawers.
- **Clarified Identity Reconciliation Naming**: Rename ambiguous state variables in contact reconciliation (such as `selectedGhostKey` to `ghostKeyOverride`) to explicitly communicate user-selected override state vs fallback default state.
- **Scope Isolation**: Keep data-structure indexing (`useMemo` maps/sets) focused solely on performance improvements where necessary, without coupling them to state synchronization refactoring.

## Testing Decisions

- **Testing Seam**: Component Integration Seam via React Testing Library (`@testing-library/react`). Tests will interact with drawer components as external consumers (opening, closing, changing props, submitting forms).
- **Good Test Criteria**: Test strictly observable UI behavior—verify that opening a drawer populates correct initial values, switching props resets the form, closing clears transient state, and no React console warnings regarding state updates during render are produced.
- **Tested Modules**: `PersonalTransactionDrawer`, `BusinessTransactionDrawer`, `SplitExpenseDrawer`, `ContactReconciliationWizard`.
- **Prior Art**: `src/components/__tests__/drawer-data-attributes.test.tsx` and `src/components/__tests__/ContactReconciliationWizard.test.tsx`.

## Out of Scope

- Modifying Server Action balance updates or database schemas.
- Altering Base UI / shadcn underlying drawer primitives.
- Global form library migrations away from `react-hook-form`.

## Further Notes

All changes must adhere to `AGENTS.md` guidelines (using `@base-ui/react` primitives via shadcn drawer wrappers, boolean data attributes, and explicit `onOpenChange` event handlers).
