# Landing Page Redesign & Feature Showcase Spec

Status: ready-for-agent

## Problem Statement

The current landing page (`src/app/page.tsx`) is a minimal placeholder that does not accurately reflect LedgerFlow's feature set. It lacks information about Personal Mode capabilities (multi-wallet tracking, budget limits, savings goals, recurring bills, peer debt tracking, and group expense splitting), fails to explain identity reconciliation concepts (`Ghost Member`, `Contact Merging`), does not showcase Business Mode capabilities, and misses technical SEO optimizations (JSON-LD structured data, metadata tags, and semantic HTML).

## Solution

Redesign the LedgerFlow landing page into a production-grade, high-converting feature showcase anchored around Personal Mode as the primary value proposition, with a secondary module introducing Business Mode:
1. **Personal Finance Hero & Overview**: Highlight instant transaction logging, net cash flow tracking, and multi-wallet management (Cash, Bank, Digital Wallets, Cards).
2. **Interactive Group Expense Split Simulator**: Embedded client island demonstrating real-time calculation for Equal, Exact Amount, and Percentage splits across group members.
3. **Social Ledger & Identity Reconciliation**: Explain peer-to-peer net balances ("You will get" / "You will give"), phone discovery, Ghost Members, and automatic Contact Merging upon sign-up according to `CONTEXT.md`.
4. **Automated Recurring Payments & Budgeting**: Showcase category spending limits with progress tracking, savings goals, and recurring payment schedules (Calendar vs. Fixed Interval) with auto-pause resilience.
5. **Business Mode Expansion Module**: Introduce multi-business entity ledgers, Customer/Supplier CRM, and receivables/payables management.
6. **Technical SEO & Aesthetics**: Provide `SoftwareApplication` JSON-LD structured schema, metadata, responsive mobile layout, and zero AI marketing slop per `docs/avoid-slop.md`.

## User Stories

1. As a prospective user visiting LedgerFlow, I want a clear hero section explaining personal finance management, so that I immediately understand what the product offers.
2. As a logged-in user visiting the homepage, I want a direct link to my dashboard, so that I can immediately access my workspace.
3. As an unauthenticated visitor, I want a visible call to action to log in or register, so that I can quickly create an account.
4. As a personal finance user, I want to see how multi-wallet tracking handles Cash, Bank accounts, Digital Wallets, and Credit Cards, so that I know I can track all my accounts in one place.
5. As a personal finance user, I want an interactive demo of category budget limits with percentage progress bars, so that I can evaluate budget tracking features.
6. As a personal finance user, I want to see how savings goals track target amounts and target deadlines, so that I can see how LedgerFlow helps me save money.
7. As a personal finance user, I want to understand how automated recurring bills manage subscriptions and utility payments with calendar or fixed-interval schedules, so that I know my recurring expenses can be automated.
8. As a user who splits expenses with friends, I want an interactive split simulator on the landing page where I can switch between Equal, Exact Amount, and Percentage split modes, so that I can experience how group expense calculations work.
9. As a user with non-registered friends, I want to understand how Ghost Members work in group ledgers, so that I know I can split expenses with people before they create an account.
10. As a user inviting friends, I want to read how Contact Merging automatically links historical Ghost Member transactions when a contact signs up via phone lookup or invite link, so that I know past group balances will not be lost.
11. As a user managing peer-to-peer debts, I want to see clear visual indicators for "You will get" and "You will give" net statuses, so that I understand how 1:1 balance tracking works.
12. As a small business owner, I want a dedicated section explaining Business Mode, so that I know LedgerFlow supports multi-entity customer/supplier CRM and receivables/payables ledgers.
13. As a user concerned about privacy, I want to read about discoverability controls for phone numbers and `@username` handles, so that I know my identity remains secure.
14. As a search engine crawler, I want structured JSON-LD data (`SoftwareApplication`) and semantic HTML tags (`h1`, `h2`, `header`, `main`, `footer`), so that the landing page ranks effectively for financial workspace keywords.
15. As a mobile website visitor, I want all interactive components and section layouts to adjust cleanly to single-column mobile viewports, so that the landing page is easily readable on phones.

## Implementation Decisions

- **Architecture & Component Seams**:
  - Main Page (`src/app/page.tsx`): Next.js Server Component providing static HTML rendering, OpenGraph tags, and JSON-LD structured schema.
  - Landing Hero Component (`src/components/landing/LandingHero.tsx`): Server component rendering the hero headline, value proposition, and CTA buttons.
  - Interactive Dashboard Preview (`src/components/landing/PersonalDashboardPreview.tsx`): Client component (`'use client'`) displaying interactive personal dashboard mock cards (account balances, spending trends, net cash flow).
  - Interactive Split Simulator (`src/components/landing/SplitSimulator.tsx`): Client component (`'use client'`) rendering interactive split mode toggles (Equal, Exact Amount, Percentage) with live member balance re-calculation.
  - Personal Features Showcase (`src/components/landing/PersonalFeaturesSection.tsx`): Server component presenting multi-wallet tracking, budget progress bars, savings goals, and recurring payment schedules.
  - Social & Ghost Merging Section (`src/components/landing/SocialLedgerSection.tsx`): Server component detailing peer debt tracking, phone lookup, Ghost Members, and Contact Merging per `CONTEXT.md`.
  - Business Mode Showcase (`src/components/landing/BusinessModeSection.tsx`): Server component introducing multi-business switching, customer/supplier ledgers, and receivables/payables cards.
  - Privacy & Security Component (`src/components/landing/SecuritySection.tsx`): Server component detailing discoverability controls and multi-auth options.

- **Data Models & Glossary Compliance**:
  - Use exact terms from `CONTEXT.md`: `Workspace Mode` (`Personal Mode` / `Business Mode`), `Registered Profile`, `Unregistered Contact`, `Ghost Member`, `Contact Merging`.
  - Use exact balance indicators: `"You will get"`, `"You will give"`, `"Settled up"`.

- **Anti-Slop Discipline (`docs/avoid-slop.md`)**:
  - No buzzwords (*"seamless"*, *"game-changer"*, *"delve"*, *"empower"*, *"holistic"*).
  - No meta-commentary preambles or manufactured TED-talk hooks.
  - Direct, factual product copy describing real software behavior and monetary logic.

- **Design System & UI Guidelines (`AGENTS.md`)**:
  - Re-use `@base-ui/react` primitives and shadcn/ui components (`Button`, `Card`, `Badge`, `Progress`, `Avatar`, `Tabs`).
  - Use boolean attributes (`data-selected`, `data-open`, `data-closed`) for custom client interactivity.

## Testing Decisions

- **Testing Seam**:
  - Component & Integration Testing Seam: `src/components/landing/__tests__/SplitSimulator.test.tsx` and `src/app/__tests__/page.test.tsx`.
  - E2E Testing Seam: `e2e/landing-page.spec.ts` using Playwright.

- **Good Test Criteria**:
  - Tests verify that `SplitSimulator` correctly computes balances when switching between Equal, Amount, and Percentage split modes.
  - Tests verify that landing page renders `SoftwareApplication` JSON-LD script and contains expected heading hierarchy (`h1`, `h2`).
  - E2E tests verify that CTA buttons direct unauthenticated users to `/login` and authenticated users to `/dashboard`.
  - Responsive layout tests verify mobile navigation and single-column rendering at 375px viewport width.

- **Prior Art**:
  - `e2e/auth.spec.ts`
  - `src/components/business/__tests__/BusinessContactList.test.tsx`

## Out of Scope

- Modifying authenticated dashboard pages (`/dashboard/*`).
- Changing backend authentication API routes or database schema.
- Creating a separate dedicated `/business` landing page URL (all content resides on `/` as agreed).

## Further Notes

- Monitored for accessibility: ensure contrast ratios comply with WCAG AA and interactive widgets support keyboard navigation (`tab`, `space`, `enter`).
