import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/env";
import { initializeNewUser } from "@/lib/domain/onboarding";

// Environmental origins setup
const rawTrustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS;
const trustedOriginsList = rawTrustedOrigins
  ? rawTrustedOrigins.split(",").map((o) => o.trim())
  : [env.BETTER_AUTH_URL];

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: trustedOriginsList,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      rateLimit: schema.rateLimit,
    },
  }),
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 10,
    max: 100,
    customRules: {
      "/api/auth/sign-in/email": { window: 60, max: 5 },
      "/api/auth/sign-up/email": { window: 60, max: 5 },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      strategy: "compact",
    },
  },
  account: {
    encryptOAuthTokens: true,
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === "production" && process.env.E2E_TEST !== "true",
    cookiePrefix: "ledgerflow",
    defaultCookieAttributes: {
      sameSite: "lax",
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await initializeNewUser(user);
        },
      },
      update: {
        after: async (user) => {
          if (user) {
            console.log(`[AUDIT] User updated ${user.id}: ${user.email}`);
          }
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          if (session) {
            console.log(`[AUDIT] Session created for user ${session.userId} (ID: ${session.id})`);
          }
        },
      },
      delete: {
        before: async (session) => {
          if (session?.id) {
            console.log(`[AUDIT] Session revoking (ID: ${session.id})`);
          }
        },
      },
    },
  },
});


