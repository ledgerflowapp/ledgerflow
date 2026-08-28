import { test, expect } from '../helpers/test-fixtures';

test.describe('Login Features', () => {
    test('should toggle password visibility', async ({ page }) => {
        await page.goto('/login');

        const passwordInput = page.getByPlaceholder('••••••••');
        await expect(passwordInput).toHaveAttribute('type', 'password');

        // Click the eye icon to show password
        const toggleButton = page.getByLabel(/Show password/i);
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Click the eye icon to hide password
        const hideButton = page.getByLabel(/Hide password/i);
        await hideButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'password');
    });

});
