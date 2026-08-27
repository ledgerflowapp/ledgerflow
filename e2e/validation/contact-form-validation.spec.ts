import { test, expect, seedRegisteredUser, authenticateContext } from '../helpers/test-fixtures';

test.describe('Contact Form Validation', () => {
  test('validates missing name, invalid phone, and duplicate entries', async ({ userAPage: page, userAContext, baseURL }) => {
    // 1. Setup and Authentication
    const uniqueUsername = 'testuser_' + Date.now();
    const user = await seedRegisteredUser({ username: uniqueUsername });
    await authenticateContext(userAContext, user.sessionToken, baseURL, user.cookies);

    // 2. Navigate to friends dashboard
    await page.goto('/dashboard/friends');

    // Handle OnboardingModal / Wizard if it appears
    const skipButton = page.getByRole('button', { name: 'Skip for now' });
    try {
        await expect(skipButton).toBeVisible({ timeout: 5000 });
        await skipButton.click();
        
        // Now we are in OnboardingWizard step 1
        await page.getByPlaceholder('Enter username').fill(uniqueUsername);
        await page.getByRole('button', { name: 'Next' }).click(); // Step 1 to 2
        await page.getByRole('button', { name: 'Next' }).click(); // Step 2 to 3
        await page.getByRole('button', { name: 'Next' }).click(); // Step 3 to 4
        await page.getByRole('button', { name: 'Complete Setup' }).click();
        
        await expect(page.getByText('Onboarding preferences saved successfully!')).toBeVisible();
        // Wait for modal to disappear
        await expect(page.getByText('Choose a Username')).not.toBeVisible();
    } catch (e) {
        // Modal didn't appear, continue
    }

    await expect(page.getByText('Your Friends')).toBeVisible({ timeout: 15000 });

    // Click "Add New" to open the add person drawer
    await page.getByText('Add New', { exact: true }).click();

    // Verify the drawer is open
    await expect(page.getByText('Add New Person')).toBeVisible();

    // 3. Test submitting contact form with missing name
    await page.getByRole('button', { name: 'Add Person', exact: true }).click();
    await expect(page.getByText('Please enter a name for this person.')).toBeVisible();

    // 4. Test submitting contact form with invalid phone number
    await page.getByLabel('Name').fill('Test Contact');
    await page.getByLabel('Phone (Optional)').fill('invalid-phone');
    await page.getByRole('button', { name: 'Add Person', exact: true }).click();
    await expect(page.getByText('Please enter a valid phone number (e.g., +919876543210).')).toBeVisible();

    // 5. Successful addition
    await page.getByLabel('Phone (Optional)').fill('+1234567890');
    await page.getByRole('button', { name: 'Add Person', exact: true }).click();
    
    // Toast notification and optimistic/reactive update
    await expect(page.getByText('Person added')).toBeVisible();
    await expect(page.getByText('Test Contact').first()).toBeVisible();

    // 6. Test duplicate entry
    // Wait a moment for drawer to close fully
    await expect(page.getByText('Add New Person')).not.toBeVisible();

    await page.getByText('Add New', { exact: true }).click();
    await expect(page.getByText('Add New Person')).toBeVisible();
    
    await page.getByLabel('Name').fill('Test Contact');
    await page.getByLabel('Phone (Optional)').fill('');
    await page.getByRole('button', { name: 'Add Person', exact: true }).click();
    
    // Toast error should show up from the server action throwing an Error
    await expect(page.getByText('You already have a person named "Test Contact" in your friends list.')).toBeVisible();
  });
});
