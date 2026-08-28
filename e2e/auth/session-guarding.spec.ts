import { test, expect } from '../helpers/test-fixtures';

const PROTECTED_ROUTES = ['/dashboard', '/transactions', '/friends', '/groups'];

test.describe('Session Guarding & Security', () => {
    test('unauthenticated navigation to /dashboard should redirect to /login with next param', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Next.js proxy should redirect us to /login?next=%2Fdashboard
        await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
    });

    test('unauthenticated navigation should preserve query parameters in next param', async ({ page }) => {
        await page.goto('/transactions?filter=recent&sort=desc');
        
        // Next.js proxy should redirect us and encode the full path including search params
        const encodedPath = encodeURIComponent('/transactions?filter=recent&sort=desc');
        await expect(page).toHaveURL(new RegExp(`\/login\\?next=${encodedPath}`));
    });

    for (const route of PROTECTED_ROUTES.filter(r => r !== '/dashboard')) {
        test(`unauthenticated navigation to ${route} should redirect to login`, async ({ page }) => {
            await page.goto(route);
            const encodedRoute = encodeURIComponent(route);
            await expect(page).toHaveURL(new RegExp(`\/login\\?next=${encodedRoute}`));
        });
    }

    for (const route of PROTECTED_ROUTES) {
        test(`forged/invalid session cookie injection on ${route} should be rejected and redirect to login`, async ({ page, baseURL }) => {
            await page.context().clearCookies();
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
            await expect(page).toHaveURL(new RegExp(`\/login\\?next=${encodedRoute}`));
        });
    }
});
