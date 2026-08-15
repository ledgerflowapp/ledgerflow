import { test, expect, generateTestPrefix, globalTestDataTracker } from '../helpers/test-fixtures';
import { db } from '@/db';
import { user } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';

test.describe('03 — Signup & Registration', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        // Toggle to signup view
        await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
    });

    test('should render mandatory fields', async ({ page }) => {
        await expect(page.getByText(/Create an Account/i)).toBeVisible();
        await expect(page.getByLabel(/Full Name/i)).toBeVisible();
        await expect(page.getByLabel(/Email/i)).toBeVisible();
        await expect(page.getByLabel(/Password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();
    });

    test('should show inline validation messages for invalid inputs', async ({ page }) => {
        // Try submitting empty
        await page.getByRole('button', { name: /Create Account/i }).click();

        // Check for inline validation messages
        await expect(page.getByText('Name must be at least 2 characters')).toBeVisible();
        await expect(page.getByText('Please enter a valid email address')).toBeVisible();
        await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();

        // Try submitting invalid formats
        await page.getByLabel(/Full Name/i).fill('A'); // < 2 characters
        await page.getByLabel(/Email/i).fill('invalid-email');
        await page.getByLabel(/Password/i).fill('12345'); // < 6 characters

        await page.getByRole('button', { name: /Create Account/i }).click();

        await expect(page.getByText('Name must be at least 2 characters')).toBeVisible();
        await expect(page.getByText('Please enter a valid email address')).toBeVisible();
        await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
    });

    test('should successfully register and initialize user profile', async ({ page }) => {
        const prefix = generateTestPrefix('signup');
        const testEmail = `${prefix}@example.com`;
        const testName = `Test User ${prefix.slice(-6)}`;
        const testPassword = 'SecurePassword123!';

        await page.getByLabel(/Full Name/i).fill(testName);
        await page.getByLabel(/Email/i).fill(testEmail);
        await page.getByLabel(/Password/i).fill(testPassword);

        // Submit form
        await page.getByRole('button', { name: /Create Account/i }).click();

        // Verify success toast
        await expect(page.getByText('Account created successfully!')).toBeVisible();

        // Verify redirect to dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // Verify user was created in DB
        const users = await db.select().from(user).where(eq(user.email, testEmail));
        expect(users.length).toBe(1);
        expect(users[0].name).toBe(testName);

        // Add to tracker for cleanup
        globalTestDataTracker.userIds.add(users[0].id);
    });
});
