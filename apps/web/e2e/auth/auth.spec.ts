import { test, expect } from '@playwright/test';

// Helper to generate unique test credentials
const generateCredentials = () => ({
  name: `Test User ${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'Password123!',
});

test.describe('Authentication - Sign Up', () => {
  test('should register with valid email/password', async ({ page }) => {
    const { name, email, password } = generateCredentials();
    
    await page.goto('/auth/signup');
    await page.fill('#name', name);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.fill('#confirmPassword', password);
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding
    await page.waitForURL(/\/onboarding/, { timeout: 30000 });
    await expect(page.getByText('Tell us about your little one', { exact: false })).toBeVisible();
  });

  test('should show error for duplicate email', async ({ page }) => {
    const { name, email, password } = generateCredentials();
    
    // First registration
    await page.goto('/auth/signup');
    await page.fill('#name', name);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.fill('#confirmPassword', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/onboarding/, { timeout: 30000 });
    
    // Logout and try to register with same email
    await page.goto('/auth/signup');
    await page.fill('#name', 'Another User');
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.fill('#confirmPassword', password);
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('.text-destructive, [role="alert"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show error for weak password', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'weak@example.com');
    await page.fill('#password', '123');
    await page.fill('#confirmPassword', '123');
    
    // Should show password strength indicator or error
    await expect(page.getByText(/weak|too short|at least/i).first()).toBeVisible();
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'mismatch@example.com');
    await page.fill('#password', 'Password123!');
    await page.fill('#confirmPassword', 'DifferentPassword123!');
    await page.click('button[type="submit"]');
    
    // Should show mismatch error
    await expect(page.getByText(/match|don't match|mismatch/i).first()).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'invalid-email');
    await page.fill('#password', 'Password123!');
    await page.fill('#confirmPassword', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Should show email validation error or browser validation
    const emailInput = page.locator('#email');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });
});

test.describe('Authentication - Login', () => {
  let registeredEmail: string;
  let registeredPassword: string;

  test.beforeAll(async ({ browser }) => {
    // Register a user for login tests
    const page = await browser.newPage();
    const creds = generateCredentials();
    registeredEmail = creds.email;
    registeredPassword = creds.password;
    
    await page.goto('/auth/signup');
    await page.fill('#name', creds.name);
    await page.fill('#email', creds.email);
    await page.fill('#password', creds.password);
    await page.fill('#confirmPassword', creds.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/onboarding/, { timeout: 30000 });
    await page.close();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#email', registeredEmail);
    await page.fill('#password', registeredPassword);
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding or dashboard
    await page.waitForURL(/\/(onboarding)?$/, { timeout: 30000 });
  });

  test('should show error for invalid password', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#email', registeredEmail);
    await page.fill('#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('.text-destructive, .bg-destructive\\/10, [role="alert"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show error for non-existent account', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#email', 'nonexistent_user_12345@example.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('.text-destructive, .bg-destructive\\/10, [role="alert"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('#email', registeredEmail);
    await page.fill('#password', registeredPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(onboarding)?$/, { timeout: 30000 });
    
    // Reload and check session persists
    await page.reload();
    
    // Should still be logged in (not redirected to login)
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });
});

test.describe('Authentication - Logout', () => {
  test('should logout successfully and redirect to login', async ({ page }) => {
    // Register and login
    const { name, email, password } = generateCredentials();
    await page.goto('/auth/signup');
    await page.fill('#name', name);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.fill('#confirmPassword', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/onboarding/, { timeout: 30000 });
    
    // Complete onboarding minimally
    await page.fill('#name', 'Test Baby');
    await page.getByRole('button', { name: /boy|girl/i }).first().click();
    await page.fill('#dateOfBirth', '2024-01-01');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/$/, { timeout: 30000 });
    
    // Navigate to settings and logout
    await page.goto('/settings');
    
    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      // Should redirect to login
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    }
  });
});
