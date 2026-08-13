import {
  test,
  expect,
  seedRegisteredUser,
  seedBankAccount,
  seedUnregisteredContact,
  seedGroupLedger,
  seedGhostMember,
  authenticateContext,
} from './test-fixtures';

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
});
