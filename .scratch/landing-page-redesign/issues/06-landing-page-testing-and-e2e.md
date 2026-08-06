# Ticket 06: Landing Page Component & E2E Testing

Status: ready-for-agent

## Description

Add automated test coverage for landing page server rendering, JSON-LD structured data presence, `SplitSimulator` client island state changes, and Playwright E2E integration.

## Tasks

- [ ] Create `src/components/landing/__tests__/SplitSimulator.test.tsx` verifying balance calculations across Equal, Amount, and Percentage modes.
- [ ] Create `src/app/__tests__/page.test.tsx` verifying server rendering of headings, meta tags, and structured JSON-LD data.
- [ ] Update or create `e2e/landing-page.spec.ts` testing CTA button navigation, simulator interaction, and mobile responsive layout rendering.
