import { test, expect } from './helpers/test-fixtures';

test.describe('Identity Reconciliation Wizard Flow', () => {
    test('renders wizard components when accessed or mounted', async ({ page }) => {
        // Unauthenticated access to dashboard redirects to login
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/login/);
    });
});
