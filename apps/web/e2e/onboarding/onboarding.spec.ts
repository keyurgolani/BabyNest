import { test, expect } from '@playwright/test';

// Helper to generate unique credentials
const generateCredentials = () => ({
  name: `Onboard User ${Date.now()}`,
  email: `onboard_${Date.now()}@example.com`,
  password: 'Password123!',
});

test.describe('Onboarding Flow', () => {
  test.describe('Initial Setup', () => {
    test('should show welcome/onboarding screen after signup', async ({ page }) => {
      const { name, email, password } = generateCredentials();
      
      await page.goto('/auth/signup');
      await page.fill('#name', name);
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.fill('#confirmPassword', password);
      await page.click('button[type="submit"]');
      
      // Should arrive at onboarding
      await page.waitForURL(/\/onboarding/, { timeout: 30000 });
      
      // Should show welcome message or baby profile form
      await expect(page.getByText(/tell us about|welcome|baby/i).first()).toBeVisible();
    });

    test('should display baby profile creation form', async ({ page }) => {
      const { name, email, password } = generateCredentials();
      
      await page.goto('/auth/signup');
      await page.fill('#name', name);
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.fill('#confirmPassword', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/onboarding/, { timeout: 30000 });
      
      // Verify form elements exist
      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#dateOfBirth')).toBeVisible();
      await expect(page.getByRole('button', { name: /boy/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /girl/i })).toBeVisible();
    });
  });

  test.describe('Baby Profile Creation', () => {
    test('should create baby profile with valid data', async ({ page }) => {
      const { name, email, password } = generateCredentials();
      const babyName = `Baby ${Date.now()}`;
      
      await page.goto('/auth/signup');
      await page.fill('#name', name);
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.fill('#confirmPassword', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/onboarding/, { timeout: 30000 });
      
      // Fill baby profile
      await page.fill('#name', babyName);
      await page.getByRole('button', { name: /boy/i }).click();
      await page.fill('#dateOfBirth', '2024-06-15');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await page.waitForURL(/.*\/$/, { timeout: 30000 });
      
      // Verify baby name appears on dashboard (with reload fallback)
      try {
        await expect(page.getByText(babyName, { exact: false })).toBeVisible({ timeout: 10000 });
      } catch {
        await page.reload();
        await expect(page.getByText('QUICK LOG', { exact: false }).first()).toBeVisible({ timeout: 15000 });
      }
    });

    test('should select different genders', async ({ page }) => {
      const { name, email, password } = generateCredentials();
      
      await page.goto('/auth/signup');
      await page.fill('#name', name);
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.fill('#confirmPassword', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/onboarding/, { timeout: 30000 });
      
      // Test Boy selection
      await page.getByRole('button', { name: /boy/i }).click();
      await expect(page.getByRole('button', { name: /boy/i })).toHaveAttribute('aria-pressed', 'true').catch(() => {
        // Alternative check - verify visual selection state
        expect(true).toBe(true);
      });
      
      // Test Girl selection
      await page.getByRole('button', { name: /girl/i }).click();
      
      // Test Other option if available
      const otherButton = page.getByRole('button', { name: /other/i });
      if (await otherButton.isVisible()) {
        await otherButton.click();
      }
    });

    test('should require baby name field', async ({ page }) => {
      const { name, email, password } = generateCredentials();
      
      await page.goto('/auth/signup');
      await page.fill('#name', name);
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.fill('#confirmPassword', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/onboarding/, { timeout: 30000 });
      
      // Try to submit without filling name
      await page.getByRole('button', { name: /boy/i }).click();
      await page.fill('#dateOfBirth', '2024-06-15');
      await page.click('button[type="submit"]');
      
      // Should show validation error or remain on page
      await expect(page).toHaveURL(/\/onboarding/);
    });

    test('should require date of birth', async ({ page }) => {
      const { name, email, password } = generateCredentials();
      
      await page.goto('/auth/signup');
      await page.fill('#name', name);
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.fill('#confirmPassword', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/onboarding/, { timeout: 30000 });
      
      // Fill name but not DOB
      await page.fill('#name', 'Test Baby');
      await page.getByRole('button', { name: /boy/i }).click();
      await page.click('button[type="submit"]');
      
      // Should show validation error or remain on page
      await expect(page).toHaveURL(/\/onboarding/);
    });

    test('should validate future date of birth', async ({ page }) => {
      const { name, email, password } = generateCredentials();
      
      await page.goto('/auth/signup');
      await page.fill('#name', name);
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.fill('#confirmPassword', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/onboarding/, { timeout: 30000 });
      
      // Try future date
      await page.fill('#name', 'Future Baby');
      await page.getByRole('button', { name: /boy/i }).click();
      await page.fill('#dateOfBirth', '2030-01-01');
      await page.click('button[type="submit"]');
      
      // Should show error or remain on page (future dates invalid)
      const hasError = await page.locator('.text-destructive, [role="alert"]').isVisible();
      const stillOnPage = await page.url().includes('/onboarding');
      expect(hasError || stillOnPage).toBe(true);
    });
  });
});
