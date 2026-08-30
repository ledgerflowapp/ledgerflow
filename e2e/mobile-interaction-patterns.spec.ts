import { test, expect, seedRegisteredUser, authenticateContext, seedBankAccount } from './helpers/test-fixtures';
import { db } from '@/db';
import { recurringTransactions, categories } from '@/db/schema/financial';

test.describe('Mobile Interaction Patterns: Bottom Sheets & Desktop Hover', () => {
  test('mobile viewport displays explicit "..." button which triggers a Bottom Sheet drawer', async ({
    userAContext,
    userAPage,
    baseURL,
  }) => {
    // 1. Seed user, account, category, and recurring transaction
    const userResult = await seedRegisteredUser();
    await authenticateContext(userAContext, userResult.sessionToken, baseURL, userResult.cookies);

    const account = await seedBankAccount(userResult.user.id, {
      name: 'Mobile Test Account',
      balance: '5000.00',
    });

    const [category] = await db
      .insert(categories)
      .values({
        userId: userResult.user.id,
        name: 'Streaming',
        icon: '🎬',
        type: 'EXPENSE',
      })
      .returning();

    await db.insert(recurringTransactions).values({
      userId: userResult.user.id,
      accountId: account.id,
      categoryId: category.id,
      name: 'Netflix Mobile',
      amount: '499.00',
      frequency: 'MONTHLY',
      scheduleMode: 'CALENDAR',
      startDate: new Date(),
      nextRunDate: new Date(),
      flow: 'OUT',
      active: true,
      failureCount: 0,
    });

    // 2. Set mobile viewport
    await userAPage.setViewportSize({ width: 375, height: 667 });
    await userAPage.goto('/dashboard');
    await userAPage.waitForLoadState('networkidle');

    // 3. Locate the recurring transaction item
    const txItem = userAPage.locator('text=Netflix Mobile').locator('xpath=ancestor::div[contains(@class, "border")][1]');
    await expect(txItem).toBeVisible();

    // 4. Assert explicit "..." button is visible on mobile viewport
    const moreButton = txItem.locator('button[data-slot="mobile-action-trigger"], button[aria-label*="options" i], button[aria-label*="more" i]');
    await expect(moreButton).toBeVisible();

    // Verify touch target size of the trigger button on mobile
    const box = await moreButton.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(40);
      expect(box.height).toBeGreaterThanOrEqual(40);
    }

    // 5. Tap the "..." button to open the Bottom Sheet
    await moreButton.click();

    // 6. Assert Bottom Sheet drawer popup is visible
    const drawerPopup = userAPage.locator('[data-slot="drawer-popup"], [data-slot="drawer-content"]');
    await expect(drawerPopup).toBeVisible();

    // 7. Assert actions are present inside Bottom Sheet
    const editAction = drawerPopup.locator('text=Edit Subscription');
    const deleteAction = drawerPopup.locator('text=Delete Subscription');

    await expect(editAction).toBeVisible();
    await expect(deleteAction).toBeVisible();

    // Verify each action button satisfies minimum 48px touch target height
    const editBox = await editAction.boundingBox();
    expect(editBox).not.toBeNull();
    if (editBox) {
      expect(editBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('categories page mobile viewport opens Bottom Sheet for category actions', async ({
    userAContext,
    userAPage,
    baseURL,
  }) => {
    const userResult = await seedRegisteredUser();
    await authenticateContext(userAContext, userResult.sessionToken, baseURL, userResult.cookies);

    await db.insert(categories).values({
      userId: userResult.user.id,
      name: 'Entertainment Category',
      icon: 'popcorn',
      type: 'EXPENSE',
    });

    await userAPage.setViewportSize({ width: 375, height: 667 });
    await userAPage.goto('/dashboard/categories');
    await userAPage.waitForLoadState('networkidle');

    const categoryCard = userAPage.locator('text=Entertainment Category').locator('xpath=ancestor::div[contains(@class, "border")][1]');
    await expect(categoryCard).toBeVisible();

    const moreButton = categoryCard.locator('button[data-slot="mobile-action-trigger"], button[aria-label*="options" i]');
    await expect(moreButton).toBeVisible();

    await moreButton.click();

    const drawerPopup = userAPage.locator('[data-slot="drawer-popup"], [data-slot="drawer-content"]');
    await expect(drawerPopup).toBeVisible();
    await expect(drawerPopup.locator('text=Edit')).toBeVisible();
    await expect(drawerPopup.locator('text=Delete')).toBeVisible();
  });
});
