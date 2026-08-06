import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

// Environmental origins setup
const rawTrustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
const trustedOriginsList = rawTrustedOrigins
  ? rawTrustedOrigins.split(",").map((o) => o.trim())
  : [process.env.BETTER_AUTH_URL || "http://localhost:3000"];

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "ledgerflow",
    defaultCookieAttributes: {
      sameSite: "lax",
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db
            .insert(schema.profiles)
            .values({
              id: user.id,
              fullName: user.name,
              email: user.email,
              avatarUrl: user.image,
            })
            .onConflictDoNothing();
          console.log(`[AUDIT] Created profile for new user: ${user.id}`);
        },
      },
      update: {
        after: async ({ data, oldData }: any) => {
          if (oldData?.email !== data?.email) {
            console.log(`[AUDIT] Email updated for user ${data?.id}: ${oldData?.email} -> ${data?.email}`);
          }
        },
      },
    },
    session: {
      create: {
        after: async ({ data }: any) => {
          if (data) {
            console.log(`[AUDIT] Session created for user ${data.userId} (ID: ${data.id})`);
          }
        },
      },
      delete: {
        before: async ({ data }: any) => {
          if (data) {
            console.log(`[AUDIT] Session revoking (ID: ${data.id})`);
          }
        },
      },
    },
  },
});


