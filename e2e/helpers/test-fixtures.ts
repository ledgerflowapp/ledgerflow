import { test as baseTest, expect, type BrowserContext, type Page } from '@playwright/test';
// Environment variables loaded via Next.js or dotenv

import { db } from '@/db';
import { user, profiles, account, session } from '@/db/schema/auth';
import { accounts, businesses, categories, transactions, transactionSplits } from '@/db/schema/financial';
import { contacts, friendships, groups, groupMembers, notifications } from '@/db/schema/social';
import { ledgers, personalLedgers, friendLedgers } from '@/db/schema/ledgers';
import { auth } from '@/lib/auth';
import { eq, inArray, like, or } from 'drizzle-orm';
import crypto from 'crypto';

// Removed global tracker as databases are ephemeral per worker

/**
 * Generate a safe unique prefix for test entities
 */
export function generateTestPrefix(tag = 'e2e'): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `e2e_test_${tag}_${timestamp}_${randomStr}`;
}

export interface SeedUserOptions {
  name?: string;
  email?: string;
  password?: string;
  username?: string;
}

export interface SeededUserResult {
  user: {
    id: string;
    name: string;
    email: string;
  };
  password: string;
  sessionToken?: string;
  cookies?: Array<{ name: string; value: string }>;
}

/**
 * Dynamically seed a registered profile with Better Auth credentials & session
 */
export async function seedRegisteredUser(options: SeedUserOptions = {}): Promise<SeededUserResult> {
  const prefix = generateTestPrefix('user');
  const email = options.email || `${prefix}@example.com`;
  const password = options.password || 'TestPassword123!';
  const name = options.name || `Test User ${prefix.slice(-6)}`;

  try {
    // Attempt sign up via Better Auth server API
    const res = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      asResponse: true,
    });

    if (res && res.ok) {
      const data = await res.json() as any;
      const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      const parsedCookies = setCookies.map(cookieStr => {
        const parts = cookieStr.split(';');
        const [nameValue] = parts;
        const eqIdx = nameValue.indexOf('=');
        const name = nameValue.substring(0, eqIdx);
        const value = nameValue.substring(eqIdx + 1);
        return { name: name.trim(), value: value.trim() };
      });

      // Ensure profile username is set if requested
      if (options.username) {
        await db
          .update(profiles)
          .set({ username: options.username })
          .where(eq(profiles.id, data.user.id));
      }

      return {
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
        },
        password,
        sessionToken: data.token || data.session?.token,
        cookies: parsedCookies,
      };
    }
  } catch (err) {
    console.error('[Test Setup] signUpEmail failed:', err);
    // Fallback: direct database insertion if auth endpoint rate limited or errors out
  }

  const userId = `usr_${prefix}`;
  const now = new Date();

  await db.insert(user).values({
    id: userId,
    name,
    email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(profiles).values({
    id: userId,
    fullName: name,
    email,
    username: options.username || `user_${prefix.slice(-8)}`,
  }).onConflictDoNothing();

  const sessionToken = `st_${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(session).values({
    id: `sess_${prefix}`,
    token: sessionToken,
    userId,
    expiresAt,
    createdAt: now,
    updatedAt: now,
  });



  return {
    user: {
      id: userId,
      name,
      email,
    },
    password,
    sessionToken,
  };
}

export interface SeedContactOptions {
  name?: string;
  phone?: string;
  type?: 'CUSTOMER' | 'SUPPLIER' | 'OTHER';
  netBalance?: string;
  businessId?: string;
  linkedUserId?: string;
}

/**
 * Dynamically seed an unregistered (or registered linked) contact for a user
 */
export async function seedUnregisteredContact(
  userId: string,
  options: SeedContactOptions = {}
) {
  const prefix = generateTestPrefix('contact');
  const contactId = crypto.randomUUID();

  const contactData = {
    id: contactId,
    userId,
    name: options.name || `Contact ${prefix.slice(-6)}`,
    phone: options.phone || `+1555${Math.floor(1000000 + Math.random() * 9000000)}`,
    type: options.type || 'OTHER',
    netBalance: options.netBalance || '0.00',
    businessId: options.businessId || null,
    linkedUserId: options.linkedUserId || null,
  };

  const [inserted] = await db.insert(contacts).values(contactData).returning();

  return inserted;
}

export interface SeedGhostMemberOptions {
  ghostName?: string;
  avatarUrl?: string;
}

/**
 * Dynamically seed a ghost member inside a group
 */
export async function seedGhostMember(
  groupId: string,
  options: SeedGhostMemberOptions = {}
) {
  const prefix = generateTestPrefix('ghost');
  const memberId = crypto.randomUUID();

  const memberData = {
    id: memberId,
    groupId,
    userId: null,
    ghostName: options.ghostName || `Ghost ${prefix.slice(-6)}`,
    avatarUrl: options.avatarUrl || null,
  };

  const [inserted] = await db.insert(groupMembers).values(memberData).returning();
  return inserted;
}

export interface SeedBankAccountOptions {
  name?: string;
  type?: 'CASH' | 'BANK' | 'WALLET' | 'OTHER';
  balance?: string;
  isDefault?: boolean;
}

/**
 * Dynamically seed a bank/financial account for a user
 */
export async function seedBankAccount(
  userId: string,
  options: SeedBankAccountOptions = {}
) {
  const prefix = generateTestPrefix('acc');
  const accountId = crypto.randomUUID();

  const accountData = {
    id: accountId,
    userId,
    name: options.name || `Bank Account ${prefix.slice(-6)}`,
    type: options.type || 'BANK',
    balance: options.balance || '1000.00',
    isDefault: options.isDefault ?? false,
  };

  const [inserted] = await db.insert(accounts).values(accountData).returning();

  return inserted;
}

export interface SeedGroupLedgerOptions {
  name?: string;
  type?: string;
  memberUserIds?: string[];
  ghostNames?: string[];
}

/**
 * Dynamically seed a group and its corresponding ledger with members & ghost members
 */
export async function seedGroupLedger(
  createdByUserId: string,
  options: SeedGroupLedgerOptions = {}
) {
  const prefix = generateTestPrefix('group');
  const groupId = crypto.randomUUID();
  const ledgerId = crypto.randomUUID();
  const groupName = options.name || `Group ${prefix.slice(-6)}`;

  // Create Group
  const [group] = await db.insert(groups).values({
    id: groupId,
    name: groupName,
    createdBy: createdByUserId,
    type: options.type || 'GENERAL',
  }).returning();



  // Add Creator as member
  const membersList = [];
  const [creatorMember] = await db.insert(groupMembers).values({
    groupId,
    userId: createdByUserId,
  }).returning();
  membersList.push(creatorMember);

  // Add additional registered user members
  if (options.memberUserIds && options.memberUserIds.length > 0) {
    for (const memberUserId of options.memberUserIds) {
      if (memberUserId !== createdByUserId) {
        const [m] = await db.insert(groupMembers).values({
          groupId,
          userId: memberUserId,
        }).returning();
        membersList.push(m);
      }
    }
  }

  // Add ghost members
  if (options.ghostNames && options.ghostNames.length > 0) {
    for (const ghostName of options.ghostNames) {
      const [g] = await db.insert(groupMembers).values({
        groupId,
        userId: null,
        ghostName,
      }).returning();
      membersList.push(g);
    }
  }

  // Create corresponding Ledger
  const [ledger] = await db.insert(ledgers).values({
    id: ledgerId,
    userId: createdByUserId,
    name: groupName,
    type: 'GROUP',
    description: `Group ledger for ${groupName}`,
  }).returning();



  return {
    group,
    members: membersList,
    ledger,
  };
}

/**
 * Helper to attach session cookies to a Playwright BrowserContext for auto-login
 */
export async function authenticateContext(
  context: BrowserContext,
  sessionToken: string | undefined,
  baseURL = 'http://127.0.0.1:3000',
  cookies?: Array<{ name: string; value: string }>
) {
  const url = new URL(baseURL);
  
  if (cookies && cookies.length > 0) {
    const playwrightCookies = cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: url.hostname,
      path: '/',
    }));
    await context.addCookies(playwrightCookies);
  } else if (sessionToken) {
    await context.addCookies([
      {
        name: 'ledgerflow.session_token',
        value: sessionToken,
        domain: url.hostname,
        path: '/',
      },
    ]);
  }
}



/**
 * Custom Playwright fixture definitions extending @playwright/test
 */
export interface CustomTestFixtures {
  baseURL: string;
  userAContext: BrowserContext;
  userBContext: BrowserContext;
  userAPage: Page;
  userBPage: Page;
}

export const test = baseTest.extend<CustomTestFixtures>({
  baseURL: async ({}, use, testInfo) => {
    const url = `http://127.0.0.1:300${testInfo.parallelIndex}`;
    process.env.BETTER_AUTH_URL = url;
    await use(url);
  },
  userAContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  userBContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  userAPage: async ({ userAContext }, use) => {
    const page = await userAContext.newPage();
    await use(page);
    await page.close();
  },
  userBPage: async ({ userBContext }, use) => {
    const page = await userBContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect };
