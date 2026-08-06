# Vercel React Performance Optimization Spec

Status: ready-for-agent

## Problem Statement

Users of LedgerFlow experience unnecessary rendering overhead, bundle bloat, and database query latency due to several React and Next.js performance anti-patterns:
- Heavy client charting dependencies (`recharts`) are statically imported on the main dashboard page, increasing initial JavaScript bundle size and delaying Time to Interactive (TTI).
- Reactive `useEffect` hooks are used to mirror props and query results into internal component state, triggering redundant double-render passes and risking state drift.
- Render loops perform O(N * M) nested array searches (e.g. `array.find()` or `array.includes()` inside `.map()`), and numerical array length guards (`items.length && <List />`) cause literal `0` text nodes to render when arrays are empty.
- Server actions run independent database queries sequentially in async waterfalls, and notification retrieval issues N+1 queries per notification item.

## Solution

Implement comprehensive performance optimizations aligned with Vercel React Best Practices:
1. Dynamic Code-Splitting: Lazy-load `AnalyticsDashboard` using `next/dynamic` with `ssr: false` and a skeleton fallback to remove `recharts` from initial route hydration.
2. Render-Time State Derivation: Remove reactive `useEffect` state synchronization hooks across drawers and wizards, replacing them with inline render derivations and event-driven form initialization.
3. Efficient Rendering & Lookups: Replace array length `&&` evaluation with strict boolean ternary operators, and hoist nested array searches into pre-built `Set` / `Map` lookup indexes.
4. Parallelized Server Actions: Combine independent backend queries into `Promise.all()` promises and perform atomic balance updates.
5. Batch Notification Fetching: Replace the N+1 loop in notification retrieval with a single bulk batch query while preserving public group invite previews for unauthenticated visitors.

## User Stories

1. As a LedgerFlow dashboard user, I want the main dashboard page to load immediately with skeleton placeholders for charts, so that I can interact with the app without waiting for heavy charting libraries to download.
2. As a group member splitting expenses, I want drawer components to initialize state directly without redundant re-render flashes, so that input fields feel crisp and responsive.
3. As a user viewing empty accounts or group lists, I want clean fallback views without accidental "0" text clutter rendered on screen, so that the user interface looks polished.
4. As a user managing large groups or friend lists, I want member lists to render efficiently without UI lag, so that scrolling and selecting members remains smooth.
5. As a user creating or updating transactions, I want server actions to process rapidly without backend query waterfalls, so that my actions complete with low latency.
6. As a user opening a WhatsApp group invite link, I want to preview the group name and avatar even before logging in, so that I know what group I am joining before signing up.
7. As a logged-in user viewing notifications, I want my notification feed to load in a single database fetch, so that the notification list populates instantly.

## Implementation Decisions

- **Dashboard Dynamic Code-Splitting**:
  - In `src/app/dashboard/page.tsx`, dynamically load `AnalyticsDashboard` via `next/dynamic(() => import(...), { ssr: false, loading: () => <AnalyticsDashboardSkeleton /> })`.
  - Exclude `recharts` from the server-side rendering pass and initial JavaScript payload.

- **Render-Time State Derivation**:
  - Remove sync `useEffect` state duplication in `ContactReconciliationWizard.tsx`, `SplitExpenseDrawer.tsx`, `PersonalTransactionDrawer.tsx`, and `BusinessTransactionDrawer.tsx`.
  - Derive fallback values during render (e.g. `const activeAccountId = accountId || defaultAccount?.id`).
  - Pass initial values directly into `useForm` defaults or populate state inside user interaction handlers.

- **Rendering Safety & O(1) Lookups**:
  - Update conditional renders in `AccountsList.tsx` and `GroupsList.tsx` from `items.length && ...` to `items.length > 0 ? ... : null`.
  - Pre-build `Set` and `Map` lookup indexes using `useMemo` in `GroupSettingsDrawer.tsx`, `SplitExpenseDrawer.tsx`, and transaction lists to turn O(N * M) array searches into O(N) operations.

- **Server Action Parallelization & Batching**:
  - Wrap independent DB queries in `src/lib/actions/categories.ts`, `contacts.ts`, and `friends.ts` in `Promise.all()`.
  - Refactor `getNotificationsAction()` in `src/lib/actions/notifications.ts` to replace the `for...of` query loop with a bulk batch query (`inArray()`).
  - Maintain public preview accessibility on `getGroupByInviteAction()` for invite links while enforcing `getSessionUser()` authentication inside `joinGroupAction()`.

## Testing Decisions

- **What Makes a Good Test**:
  - Tests must verify external behavior (e.g., component rendering state, API response payloads, correct database mutations) rather than internal implementation details.
- **Modules to be Tested**:
  - `AnalyticsDashboard` dynamic render testing in dashboard route tests.
  - Form drawer initial state rendering and submit behavior in `PersonalTransactionDrawer.test.tsx` and `SplitExpenseDrawer.test.tsx`.
  - Notification action batch retrieval in server action unit tests.
- **Prior Art**:
  - Reference existing component tests in `src/components/__tests__/` and server action tests in `src/app/api/cron/recurring/__tests__/route.test.ts`.

## Out of Scope

- Rewriting `lucide-react` import statements across component files.
- Modifying database schemas (`drizzle/schema`) or Better Auth authentication configuration.
- Changes to third-party styling presets or Tailwind configuration.

## Further Notes

- All changes adhere strictly to `AGENTS.md` guidelines and Vercel React Best Practices.
