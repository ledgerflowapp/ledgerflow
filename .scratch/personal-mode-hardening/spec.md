# Personal Mode Feature Remediation & Hardening Spec

Status: ready-for-agent

## Problem Statement

Personal Mode in LedgerFlow currently suffers from critical calculation bugs, incomplete server action contracts, disabled UI drawer interactions, and repository standards violations:
- Category monthly budgets are severely distorted due to a 100x unit mismatch (Paise vs. Rupees).
- Transaction editing is disabled from list views due to no-op callback stubs, and transaction updates/deletions fail to adjust account balances or perform soft deletes.
- The notification feed query strictly filters for ghost merge requests and drops standard notifications (`FRIEND_REQ`, `GROUP_INVITE`, `EXPENSE_ADDED`).
- Swallowed error handling in contact deletion silently returns `undefined` on failure instead of propagating actionable errors.
- Key UI components (`table.tsx`, `tooltip.tsx`, `navigation-menu.tsx`, `sidebar.tsx`, `attachment.tsx`) violate Base UI standards by using legacy Radix `data-[state=...]` selectors.

## Solution

Remediate Personal Mode server actions, calculation utilities, notification feeds, and UI components to achieve full specification compliance and repository standards alignment:
1. Normalize category budget spending calculations by converting accumulated paise amounts to rupees before comparing against monthly budget limits.
2. Complete transaction edit and delete flows: update account balances atomically upon transaction edit/delete, support soft deletion, and connect UI drawer edit handlers.
3. Expand notification queries to return all Personal Mode notification types (`FRIEND_REQ`, `GROUP_INVITE`, `EXPENSE_ADDED`).
4. Replace swallowed `undefined` returns in server actions with explicit thrown errors or structured result objects.
5. Refactor UI primitives to use boolean data attributes (`data-selected`, `data-open`, `data-closed`, `data-collapsed`) according to `AGENTS.md`.

## User Stories

1. As a personal finance user, I want category budget progress bars to compare spending in Rupees against my limit in Rupees, so that my percentage used and remaining budget display accurately.
2. As a personal finance user, I want to edit existing transactions directly from the transaction detail drawer, so that I can correct amounts, dates, notes, categories, or payment accounts.
3. As a personal finance user, I want editing a transaction amount or payment account to automatically re-balance the source and target account balances, so that my balance tracking stays consistent.
4. As a personal finance user, I want deleting a transaction to restore the deducted or credited amount to my account balance, so that my financial total remains accurate.
5. As a personal finance user, I want deleted transactions to be soft-deleted, so that audit history is preserved and data is recoverable if needed.
6. As a personal finance user, I want my notification feed to show friend requests, group invitations, and shared expense additions alongside ghost merge requests, so that I stay informed of all personal activity.
7. As a personal finance user, I want contact deletion attempts that fail or lack authorization to raise clear errors, so that I know when an action succeeds or fails.
8. As a web/mobile user, I want table rows, tooltips, sidebar menus, and navigation elements to use Base UI boolean attributes, so that UI styling and theme states render reliably.

## Implementation Decisions

- **Category Budget Module**:
  - Update category budget aggregation logic to scale accumulated paise transactions to Rupees before comparing with category budget limits.
  - Retain Paise precision in the database while standardizing display and ratio calculations in Rupees.

- **Transaction Management Module**:
  - Implement balance adjustment delta logic inside transaction update actions: when amount or account ID changes, calculate original vs. new balance impact and execute atomic updates on account balances.
  - Implement soft deletion (`deleted_at` timestamp) in transaction delete actions and apply reverse balance adjustments.
  - Connect transaction list view edit callbacks to open the transaction drawer pre-populated with existing record state.

- **Notification Center Module**:
  - Modify notification fetch query to include `FRIEND_REQ`, `GROUP_INVITE`, and `EXPENSE_ADDED` notification types in the aggregated user notification feed.

- **Contacts & Guard Module**:
  - Update contact deletion server actions to check authorization and row count explicitly, returning an error response or throwing an exception when deletion fails or record is unowned.
  - Remove pure delegating middle-man wrappers where direct call sites can invoke guard validators.

- **UI Component Styling Primitives**:
  - Audit and refactor Tailwind styles across UI components (`table`, `tooltip`, `navigation-menu`, `sidebar`, `attachment`) to replace `data-[state=...]` with Base UI boolean selectors (`data-selected`, `data-open`, `data-closed`, `data-collapsed`).

## Testing Decisions

- **Testing Seam**:
  - Primary Testing Seam: **Server Actions Integration Seam** (`src/lib/actions/__tests__/`). Server actions will be tested end-to-end against a test Postgres database instance.
  - Secondary Testing Seam: **UI Hook & Component Seam** (`src/hooks/__tests__/`).

- **Good Test Criteria**:
  - Tests verify external behavior, return values, database state changes, and account balance side-effects.
  - Avoid asserting on internal intermediate helper variables or private function implementation details.

- **Prior Art**:
  - `src/lib/actions/__tests__/transactions.test.ts`
  - `src/lib/actions/__tests__/groups.test.ts`
  - `src/hooks/__tests__/usePersonalPeople.test.ts`

## Out of Scope

- Modifying Business Mode workspace features or dual-mode switching architecture.
- Altering external OAuth or Better Auth login flows.
- Refactoring unrequested group ghost auto-matcher background services beyond securing existing Personal Mode contracts.

## Further Notes

- All monetary calculations in server actions must maintain Paise as the source of truth, converting to Rupees only at UI boundaries or float budget comparisons.
