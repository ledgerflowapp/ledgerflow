import { test, expect } from '../helpers/test-fixtures';
import { seedRegisteredUser } from '../helpers/test-fixtures';
import type { Page } from '@playwright/test';

class LoginPage {
    constructor(public readonly page: Page) {}

    readonly emailInput = this.page.getByPlaceholder('m@example.com');
    readonly passwordInput = this.page.getByPlaceholder('••••••••');
    readonly signInButton = this.page.getByRole('button', { name: /^Sign In$/i });
    readonly googleButton = this.page.getByRole('button', { name: /Continue with Google/i });
    readonly errorMessage = this.page.getByText(/Authentication Error/i);
    readonly emailError = this.page.getByText('Please enter a valid email address');
    readonly passwordError = this.page.getByText('Password must be at least 6 characters');
}

test.describe('Login Interaction', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should render login form, email/password inputs, and Google OAuth action button', async ({ page }) => {
        const loginPage = new LoginPage(page);
        
        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.signInButton).toBeVisible();
        await expect(loginPage.googleButton).toBeVisible();
    });

    test('should validate credentials input on client side', async ({ page }) => {
        const loginPage = new LoginPage(page);
        
        // Test empty submission
        await loginPage.signInButton.click();
        await expect(loginPage.emailError).toBeVisible();
        await expect(loginPage.passwordError).toBeVisible();

        // Test invalid email format and short password
        await loginPage.emailInput.fill('not-an-email');
        await loginPage.passwordInput.fill('short'); // Too short
        await loginPage.signInButton.click();
        
        await expect(loginPage.emailError).toBeVisible();
        await expect(loginPage.passwordError).toBeVisible();
    });

    test('should show user-friendly error message on invalid credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);
        
        await loginPage.emailInput.fill('invalid@example.com');
        await loginPage.passwordInput.fill('wrongpassword');
        await loginPage.signInButton.click();

        await expect(loginPage.errorMessage).toBeVisible();
    });

    test('should successfully authenticate user and redirect to /dashboard', async ({ page }) => {
        // Seed a user
        const { user, password } = await seedRegisteredUser();
        const loginPage = new LoginPage(page);

        await loginPage.emailInput.fill(user.email);
        await loginPage.passwordInput.fill(password);
        await loginPage.signInButton.click();

        await expect(page).toHaveURL(/\/dashboard/);
    });
});
