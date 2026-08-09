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

// Global tracker for created test entities to allow targeted teardown
export const testDataTracker = {
  users: new Set<string>(),
  contacts: new Set<string>(),
  groups: new Set<string>(),
  accounts: new Set<string>(),
  ledgers: new Set<string>(),
  categories: new Set<string>(),
  businesses: new Set<string>(),
  transactions: new Set<string>(),
  sessions: new Set<string>(),
};

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
    });

    if (res && res.user) {
      testDataTracker.users.add(res.user.id);
      const sessionToken = (res as any).token || (res as any).session?.token;
      if (sessionToken) {
        testDataTracker.sessions.add(sessionToken);
      }

      // Ensure profile username is set if requested
      if (options.username) {
        await db
          .update(profiles)
          .set({ username: options.username })
          .where(eq(profiles.id, res.user.id));
      }

      return {
        user: {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
        },
        password,
        sessionToken,
      };
    }
  } catch {
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

  testDataTracker.users.add(userId);
  testDataTracker.sessions.add(sessionToken);

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
  testDataTracker.contacts.add(inserted.id);
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
  testDataTracker.accounts.add(inserted.id);
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

  testDataTracker.groups.add(groupId);

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

  testDataTracker.ledgers.add(ledgerId);

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
  sessionToken: string,
  baseURL = 'http://localhost:3005'
) {
  const url = new URL(baseURL);
  await context.addCookies([
    {
      name: 'ledgerflow.session_token',
      value: sessionToken,
      domain: url.hostname,
      path: '/',
    },
    {
      name: 'better-auth.session_token',
      value: sessionToken,
      domain: url.hostname,
      path: '/',
    },
  ]);
}

/**
 * Automated post-execution teardown utility to reliably wipe test entities
 */
export async function cleanupTestData() {
  try {
    const trackedUserIds = Array.from(testDataTracker.users);
    const trackedContactIds = Array.from(testDataTracker.contacts);
    const trackedGroupIds = Array.from(testDataTracker.groups);
    const trackedAccountIds = Array.from(testDataTracker.accounts);
    const trackedLedgerIds = Array.from(testDataTracker.ledgers);
    const trackedCategoryIds = Array.from(testDataTracker.categories);
    const trackedBusinessIds = Array.from(testDataTracker.businesses);
    const trackedTransactionIds = Array.from(testDataTracker.transactions);
    const trackedSessionTokens = Array.from(testDataTracker.sessions);

    // 1. Clean up transaction splits & transactions
    if (trackedTransactionIds.length > 0) {
      await db.delete(transactionSplits).where(inArray(transactionSplits.transactionId, trackedTransactionIds));
      await db.delete(transactions).where(inArray(transactions.id, trackedTransactionIds));
    }
    // Fallback: wipe transactions created by e2e test users
    if (trackedUserIds.length > 0) {
      await db.delete(transactions).where(inArray(transactions.userId, trackedUserIds));
    }

    // Deletes transactions matching e2e test pattern
    await db.delete(transactions).where(like(transactions.name, 'e2e_test_%'));

    // 2. Clean up Group members and Groups
    if (trackedGroupIds.length > 0) {
      await db.delete(groupMembers).where(inArray(groupMembers.groupId, trackedGroupIds));
      await db.delete(groups).where(inArray(groups.id, trackedGroupIds));
    }
    await db.delete(groups).where(like(groups.name, 'e2e_test_%'));

    // 3. Clean up Ledgers
    if (trackedLedgerIds.length > 0) {
      await db.delete(personalLedgers).where(inArray(personalLedgers.ledgerId, trackedLedgerIds));
      await db.delete(friendLedgers).where(inArray(friendLedgers.ledgerId, trackedLedgerIds));
      await db.delete(ledgers).where(inArray(ledgers.id, trackedLedgerIds));
    }
    if (trackedUserIds.length > 0) {
      await db.delete(ledgers).where(inArray(ledgers.userId, trackedUserIds));
    }
    await db.delete(ledgers).where(like(ledgers.name, 'e2e_test_%'));

    // 4. Clean up Contacts
    if (trackedContactIds.length > 0) {
      await db.delete(contacts).where(inArray(contacts.id, trackedContactIds));
    }
    if (trackedUserIds.length > 0) {
      await db.delete(contacts).where(inArray(contacts.userId, trackedUserIds));
    }
    await db.delete(contacts).where(like(contacts.name, 'e2e_test_%'));

    // 5. Clean up Bank Accounts
    if (trackedAccountIds.length > 0) {
      await db.delete(accounts).where(inArray(accounts.id, trackedAccountIds));
    }
    if (trackedUserIds.length > 0) {
      await db.delete(accounts).where(inArray(accounts.userId, trackedUserIds));
    }
    await db.delete(accounts).where(like(accounts.name, 'e2e_test_%'));

    // 6. Clean up Categories & Businesses
    if (trackedCategoryIds.length > 0) {
      await db.delete(categories).where(inArray(categories.id, trackedCategoryIds));
    }
    if (trackedBusinessIds.length > 0) {
      await db.delete(businesses).where(inArray(businesses.id, trackedBusinessIds));
    }

    // 7. Clean up Friendships & Notifications
    if (trackedUserIds.length > 0) {
      await db.delete(friendships).where(
        or(
          inArray(friendships.userId1, trackedUserIds),
          inArray(friendships.userId2, trackedUserIds)
        )
      );
      await db.delete(notifications).where(inArray(notifications.userId, trackedUserIds));
    }

    // 8. Clean up Auth tables for test users
    if (trackedSessionTokens.length > 0) {
      await db.delete(session).where(inArray(session.token, trackedSessionTokens));
    }

    if (trackedUserIds.length > 0) {
      await db.delete(session).where(inArray(session.userId, trackedUserIds));
      await db.delete(account).where(inArray(account.userId, trackedUserIds));
      await db.delete(profiles).where(inArray(profiles.id, trackedUserIds));
      await db.delete(user).where(inArray(user.id, trackedUserIds));
    }

    // Fallback: Delete any lingering user matching e2e prefix
    await db.delete(user).where(like(user.email, '%e2e_test_%'));
    await db.delete(user).where(like(user.id, '%e2e_test_%'));

    // Clear trackers
    testDataTracker.users.clear();
    testDataTracker.contacts.clear();
    testDataTracker.groups.clear();
    testDataTracker.accounts.clear();
    testDataTracker.ledgers.clear();
    testDataTracker.categories.clear();
    testDataTracker.businesses.clear();
    testDataTracker.transactions.clear();
    testDataTracker.sessions.clear();
  } catch (err) {
    console.error('Error during cleanupTestData:', err);
  }
}

/**
 * Custom Playwright fixture definitions extending @playwright/test
 */
export interface CustomTestFixtures {
  userAContext: BrowserContext;
  userBContext: BrowserContext;
  userAPage: Page;
  userBPage: Page;
}

export const test = baseTest.extend<CustomTestFixtures>({
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
