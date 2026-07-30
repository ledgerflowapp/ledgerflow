# 02 — Auth & Session Management (Better Auth Integration)

**What to build:** Complete end-to-end authentication (Email/Password & Google OAuth) and session management powered by Better Auth integrated with Drizzle ORM, allowing users to register, log in, manage active sessions, and access protected routes via Next.js middleware.

**Blocked by:** 01 — Drizzle DB Client & Core Schema Setup

**Status:** ready-for-agent

- [ ] `better-auth` installed and configured in `src/lib/auth.ts` using `drizzleAdapter`.
- [ ] Route handler at `src/app/api/auth/[...all]/route.ts` created for handling auth requests.
- [ ] Better Auth React client created in `src/lib/auth-client.ts`.
- [ ] Login and signup pages refactored to use Better Auth client hooks instead of Supabase Auth.
- [ ] Next.js middleware (`src/middleware.ts`) updated to validate HTTP-only Better Auth session cookies.
- [ ] User registration, sign-in, and session persistence verified end-to-end.
