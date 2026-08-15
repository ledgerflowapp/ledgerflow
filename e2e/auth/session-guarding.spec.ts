import { test, expect } from '../helpers/test-fixtures';

const PROTECTED_ROUTES = ['/dashboard', '/transactions', '/friends', '/groups'];

test.describe('Session Guarding & Security', () => {
    test('unauthenticated navigation to /dashboard should redirect to /login with next param', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Next.js middleware should redirect us to /login?next=%2Fdashboard
        await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
    });

    test('unauthenticated navigation to protected transaction and group routes', async ({ page }) => {
        for (const route of PROTECTED_ROUTES.filter(r => r !== '/dashboard')) {
            await page.goto(route);
            const encodedRoute = encodeURIComponent(route);
            await expect(page).toHaveURL(new RegExp(`^/login\\?next=${encodedRoute}`));
        }
    });

    test('forged/invalid session cookie injection should be rejected and redirect to login', async ({ page, baseURL }) => {
        for (const route of PROTECTED_ROUTES) {
            // Set a forged session cookie
            await page.context().addCookies([
                {
                    name: 'ledgerflow.session_token',
                    value: 'forged_invalid_session_token_123',
                    url: baseURL,
                }
            ]);

            await page.goto(route);
            const encodedRoute = encodeURIComponent(route);
            await expect(page).toHaveURL(new RegExp(`^/login\\?next=${encodedRoute}`));
        }
    });
});
