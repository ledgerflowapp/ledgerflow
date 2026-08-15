import {
  test,
  expect,
  seedRegisteredUser,
  seedBankAccount,
  seedUnregisteredContact,
  seedGroupLedger,
  seedGhostMember,
  authenticateContext,
  cleanupTestData,
} from './test-fixtures';
import { db } from '@/db';
import { user } from '@/db/schema/auth';
import { accounts } from '@/db/schema/financial';
import { contacts, groups, groupMembers } from '@/db/schema/social';
import { ledgers } from '@/db/schema/ledgers';
import { eq, inArray } from 'drizzle-orm';

test.describe('E2E Test Infrastructure & Multi-Browser Helper Suite', () => {

  test('should provide isolated userAContext and userBContext fixtures', async ({
    userAContext,
    userBContext,
    userAPage,
    userBPage,
  }) => {
    expect(userAContext).toBeDefined();
    expect(userBContext).toBeDefined();
    expect(userAContext).not.toBe(userBContext);

    expect(userAPage).toBeDefined();
    expect(userBPage).toBeDefined();

    // Verify navigation works independently in both pages
    await userAPage.goto('/');
    await userBPage.goto('/');

    await expect(userAPage.locator('h1')).toContainText('Clear, Factual Financial Records');
    await expect(userBPage.locator('h1')).toContainText('Clear, Factual Financial Records');
  });

  test('should dynamically seed registered user, bank account, and authenticate browser session', async ({
    userAContext,
    userAPage,
    baseURL,
  }) => {
    // 1. Seed user & bank account
    const userA = await seedRegisteredUser({ name: 'Alice Test' });
    expect(userA.user.id).toBeDefined();
    expect(userA.user.email).toContain('e2e_test_user');

    const bankAcc = await seedBankAccount(userA.user.id, { name: 'E2E Savings Account', balance: '2500.00' });
    expect(bankAcc.id).toBeDefined();
    expect(bankAcc.name).toBe('E2E Savings Account');

    // 2. Authenticate session in userAContext
    if (userA.cookies || userA.sessionToken) {
      await authenticateContext(userAContext, userA.sessionToken, baseURL, userA.cookies);
    }

    // 3. Navigate userAPage to dashboard
    await userAPage.goto('/dashboard');
    await expect(userAPage).toHaveURL(/\/dashboard/);
  });

  test('should dynamically seed unregistered contacts, group ledgers, and ghost members', async ({
    userAContext,
  }) => {
    const userA = await seedRegisteredUser({ name: 'Bob Test' });
    const userB = await seedRegisteredUser({ name: 'Charlie Test' });

    // Seed contact
    const contact = await seedUnregisteredContact(userA.user.id, {
      name: 'Dave Unregistered',
      type: 'CUSTOMER',
    });
    expect(contact.id).toBeDefined();
    expect(contact.name).toBe('Dave Unregistered');

    // Seed group with creator + registered member + ghost member
    const groupResult = await seedGroupLedger(userA.user.id, {
      name: 'Weekend Trip Group',
      memberUserIds: [userB.user.id],
      ghostNames: ['Eve Ghost'],
    });

    expect(groupResult.group.id).toBeDefined();
    expect(groupResult.group.name).toBe('Weekend Trip Group');
    expect(groupResult.ledger.id).toBeDefined();
    expect(groupResult.members.length).toBe(3); // Creator + Charlie + Eve Ghost

    // Seed additional ghost member
    const ghost2 = await seedGhostMember(groupResult.group.id, { ghostName: 'Frank Ghost' });
    expect(ghost2.id).toBeDefined();
    expect(ghost2.ghostName).toBe('Frank Ghost');
  });

  test('should reliably clean up test entities with cleanupTestData()', async () => {
    // 1. Seed user, bank account, contact, group with member and ghost member
    const testUser = await seedRegisteredUser({ name: 'Cleanup Test User' });
    const testUser2 = await seedRegisteredUser({ name: 'Cleanup Friend' });
    const bankAcc = await seedBankAccount(testUser.user.id, { name: 'Cleanup Bank' });
    const contact = await seedUnregisteredContact(testUser.user.id, { name: 'Cleanup Contact' });
    const groupData = await seedGroupLedger(testUser.user.id, {
      name: 'Cleanup Group',
      memberUserIds: [testUser2.user.id],
      ghostNames: ['Cleanup Ghost'],
    });

    // 2. Verify entities exist in database
    const [foundUser] = await db.select().from(user).where(eq(user.id, testUser.user.id));
    expect(foundUser).toBeDefined();
    expect(foundUser.id).toBe(testUser.user.id);

    const [foundAccount] = await db.select().from(accounts).where(eq(accounts.id, bankAcc.id));
    expect(foundAccount).toBeDefined();

    const [foundContact] = await db.select().from(contacts).where(eq(contacts.id, contact.id));
    expect(foundContact).toBeDefined();

    const [foundGroup] = await db.select().from(groups).where(eq(groups.id, groupData.group.id));
    expect(foundGroup).toBeDefined();

    const [foundLedger] = await db.select().from(ledgers).where(eq(ledgers.id, groupData.ledger.id));
    expect(foundLedger).toBeDefined();

    // 3. Execute cleanupTestData
    await cleanupTestData({
      userIds: [testUser.user.id, testUser2.user.id],
      groupIds: [groupData.group.id],
      contactIds: [contact.id],
      accountIds: [bankAcc.id],
      ledgerIds: [groupData.ledger.id],
    });

    // 4. Verify entities are wiped from database
    const [deletedUser] = await db.select().from(user).where(eq(user.id, testUser.user.id));
    expect(deletedUser).toBeUndefined();

    const [deletedUser2] = await db.select().from(user).where(eq(user.id, testUser2.user.id));
    expect(deletedUser2).toBeUndefined();

    const [deletedAccount] = await db.select().from(accounts).where(eq(accounts.id, bankAcc.id));
    expect(deletedAccount).toBeUndefined();

    const [deletedContact] = await db.select().from(contacts).where(eq(contacts.id, contact.id));
    expect(deletedContact).toBeUndefined();

    const [deletedGroup] = await db.select().from(groups).where(eq(groups.id, groupData.group.id));
    expect(deletedGroup).toBeUndefined();

    const [deletedLedger] = await db.select().from(ledgers).where(eq(ledgers.id, groupData.ledger.id));
    expect(deletedLedger).toBeUndefined();
  });
});
