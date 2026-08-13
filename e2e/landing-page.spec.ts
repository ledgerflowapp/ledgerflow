import { test, expect } from './helpers/test-fixtures';

test.describe('Redesigned Landing Page E2E Suite', () => {
  test('should render all custom marketing, features, and pricing sections accurately', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Check main title
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toContainText('Clear, Factual Financial Records');

    // Check for sections and feature modules
    const personalFeaturesSection = page.locator('#personal-features');
    await expect(personalFeaturesSection).toBeVisible();
    await expect(personalFeaturesSection).toContainText('Multi-Wallet Asset Tracking');

    const socialLedgerSection = page.locator('#social-ledger');
    await expect(socialLedgerSection).toBeVisible();
    await expect(socialLedgerSection).toContainText('Ghost Member Participation');

    const businessModeSection = page.locator('#business-mode');
    await expect(businessModeSection).toBeVisible();
    await expect(businessModeSection).toContainText('Multi-Business Entity CRM & Ledger Systems');

    const securitySection = page.locator('#security');
    await expect(securitySection).toBeVisible();
    await expect(securitySection).toContainText('Strict Multi-Mode Isolation and Discoverability Safety');
  });

  test('should support interactive split modes in SplitSimulator', async ({ page }) => {
    await page.goto('/');

    const simulator = page.locator('#social-ledger');
    await expect(simulator).toBeVisible();

    // The simulator default values (Total: 300) should divide equally by default to show ₹100.00
    await expect(page.locator('text=₹100.00').first()).toBeVisible();

    // Click on Exact Split tab
    const exactTabButton = page.locator('button:has-text("Exact (₹)")');
    await exactTabButton.click();
    await expect(page.locator('text=Enter exact rupees for each member. Sum must equal total.')).toBeVisible();

    // Click on Percent Split tab
    const percentTabButton = page.locator('button:has-text("Percent (%)")');
    await percentTabButton.click();
    await expect(page.locator('text=Enter percentage shares. Total percentage must equal 100%.')).toBeVisible();
  });

  test('should adjust correctly to mobile responsive viewport and allow CTA navigation', async ({ page }) => {
    // Set viewport to mobile width (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that header menu trigger button exists and can be clicked
    const menuButton = page.locator('button[aria-label="Toggle Menu"]');
    await expect(menuButton).toBeVisible();

    // Direct dispatchEvent click to prevent Tanstack Devtools panel overlap block
    await menuButton.dispatchEvent('click');

    // Wait for dropdown to be fully open
    await page.waitForTimeout(500);

    // Ensure links in mobile menu dropdown are visible
    const personalFeaturesLink = page.locator('a:has-text("Personal Features")').last();
    await expect(personalFeaturesLink).toBeVisible();

    // Click hero button and expect redirection to /login when unauthenticated
    const heroCtaButton = page.locator('section a[href="/login"]').first();
    await expect(heroCtaButton).toBeVisible();
    await heroCtaButton.click({ force: true });

    // Expect we are navigated to the Login route
    await expect(page).toHaveURL(/\/login/);
  });
});
