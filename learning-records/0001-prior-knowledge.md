# 0001 - Auth Testing Concepts & Options Disclosed

The user dislcosed being new to testing libraries (Vitest) and Better Auth. They are evaluating session mocking strategies (Option A: inline `vi.mocked(auth.api.getSession)` vs Option B: shared `mockSession` helper) across server action test files (`goals.test.ts`, `transactions.test.ts`, `friends.test.ts`, `groups.test.ts`).

## Implications
Future lessons should clearly explain the relationship between runtime JavaScript mocks (`vi.fn()`), TypeScript type casting (`vi.mocked()`), and test abstraction design choices.
