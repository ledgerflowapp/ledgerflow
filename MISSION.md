# Mission: Master Testing Patterns for Better Auth & Server Actions

## Why
Understand core testing concepts, Vitest mocking primitives (`vi.mocked`), and auth session patterns to design clean, maintainable, and robust test suites across server action test files (`goals.test.ts`, `transactions.test.ts`, `friends.test.ts`, `groups.test.ts`).

## Success looks like
- Confidently evaluate and select testing patterns (inline `vi.mocked` vs shared `mockSession` helper).
- Master how Vitest mocking (`vi.mock`, `vi.mocked`, `mockResolvedValue`) works with TypeScript.
- Write clean, non-repetitive tests for authenticated and unauthenticated server actions.

## Constraints
- Project uses Vitest, Better Auth, TypeScript, Next.js Server Actions.
- Learner is new to testing libraries and Better Auth concepts.

## Out of scope
- Full E2E Playwright setup (focused on unit/integration testing of Server Actions).
- Database migrations and schema design.
