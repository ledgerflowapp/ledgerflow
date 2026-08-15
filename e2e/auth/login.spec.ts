import { test, expect } from '../helpers/test-fixtures';
import { seedRegisteredUser } from '../helpers/test-fixtures';

test.describe('Login Interaction', () => {
    test('should render login form, email/password inputs, and Google OAuth action button', async ({ page }) => {
        await page.goto('/login');

        // Check for title
        await expect(page.getByText(/Welcome to LedgerFlow/i)).toBeVisible();

        // Check for Email & Password inputs
        await expect(page.getByPlaceholder('m@example.com')).toBeVisible();
        await expect(page.getByPlaceholder('••••••••')).toBeVisible();

        // Check for buttons
        await expect(page.getByRole('button', { name: /^Sign In$/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
    });

    test('should show user-friendly error message on invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.getByPlaceholder('m@example.com').fill('invalid@example.com');
        await page.getByPlaceholder('••••••••').fill('wrongpassword');
        await page.getByRole('button', { name: /^Sign In$/i }).click();

        // The error message is rendered in the alert section
        await expect(page.getByText(/Authentication Error/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Try Again/i })).toBeVisible();
    });

    test('should successfully authenticate user and redirect to /dashboard', async ({ page }) => {
        // Seed a user
        const { user, password } = await seedRegisteredUser();

        await page.goto('/login');

        await page.getByPlaceholder('m@example.com').fill(user.email);
        await page.getByPlaceholder('••••••••').fill(password);
        await page.getByRole('button', { name: /^Sign In$/i }).click();

        await expect(page).toHaveURL(/\/dashboard/);
    });
});
