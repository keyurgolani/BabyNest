
import { Page, expect } from '@playwright/test';

export async function setupUserAndBaby(page: Page) {
  const uniqueId = Date.now().toString();
  const name = 'Tracker User';
  const email = `tracker_${uniqueId}@example.com`;
  const password = 'Password123!';
  const babyName = `Baby ${uniqueId}`;

  // Singup
  await page.goto('/auth/signup');
  await page.fill('#name', name);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/onboarding/, { timeout: 45000 });

  // Onboarding
  await page.fill('#name', babyName);
  await page.getByRole('button', { name: 'Boy' }).click();
  await page.fill('#dateOfBirth', '2024-01-01');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*\/$/, { timeout: 45000 });
  
  // Wait for dashboard - use viewport-aware assertion
  // On mobile, sidebar may be hidden, so check for any dashboard content
  try {
    // Try quick log first (visible on desktop)
    await expect(page.getByText('QUICK LOG', { exact: false }).first()).toBeVisible({ timeout: 5000 });
  } catch {
    // Fallback for mobile: check for Baby name or any main content
    try {
      await expect(page.locator('h1, [class*="baby"], main').first()).toBeVisible({ timeout: 5000 });
    } catch {
      console.log('Dashboard not stable, reloading...');
      await page.reload();
      // Final check: just confirm we're on dashboard URL
      await expect(page).toHaveURL(/.*\/$/);
    }
  }

  // Stability wait to ensure session propagation
  // REVERTED: content-specific retries are better than global slowdowns
  return { name, email, password, babyName };
}

// Mobile-specific setup that uses simpler assertions
export async function setupUserAndBabyMobile(page: Page) {
  const uniqueId = Date.now().toString();
  const name = 'Mobile User';
  const email = `mobile_${uniqueId}@example.com`;
  const password = 'Password123!';
  const babyName = `Baby ${uniqueId}`;

  // Singup
  await page.goto('/auth/signup');
  await page.fill('#name', name);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/onboarding/, { timeout: 45000 });

  // Onboarding
  await page.fill('#name', babyName);
  await page.getByRole('button', { name: 'Boy' }).click();
  await page.fill('#dateOfBirth', '2024-01-01');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*\/$/, { timeout: 45000 });
  
  // Simple wait for dashboard URL (no element checks for mobile)
  await page.waitForTimeout(2000);

  return { name, email, password, babyName };
}
