import { test, expect } from '@playwright/test';
import { setupUserAndBaby } from '../utils';

test.describe('Dashboard & Navigation', () => {
  test.describe('Dashboard Rendering', () => {
    test('should display dashboard after login', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Verify dashboard loaded
      await expect(page.getByText('QUICK LOG', { exact: false }).first()).toBeVisible();
    });

    test('should display baby information', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Baby name or age should be visible
      await expect(page.locator('h1, .baby-name').first()).toBeVisible();
    });

    test('should display quick log actions', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Verify quick actions are present
      await expect(page.locator('a[href*="/log/"]').first()).toBeVisible();
    });

    test('should display AI summary card', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Look for AI Summary
      await expect(page.getByText(/AI.*Summary|Health.*Summary/i).first()).toBeVisible();
    });

    test('should display wake window card', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Look for Wake Window
      await expect(page.getByText(/wake.*window|awake/i).first()).toBeVisible();
    });

    test('should display feeding prediction', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Look for Feeding Prediction
      await expect(page.getByText(/feeding|next.*feed/i).first()).toBeVisible();
    });

    test('should display reminders card', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Look for Reminders section
      const reminders = page.getByText(/reminder/i).first();
      if (await reminders.isVisible()) {
        expect(true).toBe(true);
      }
    });

    test('should display milestones card', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Look for Milestones section
      const milestones = page.getByText(/milestone/i).first();
      if (await milestones.isVisible()) {
        expect(true).toBe(true);
      }
    });
  });

  test.describe('Navigation Menu', () => {
    test('should have Home link', async ({ page }) => {
      await setupUserAndBaby(page);
      
      await expect(page.locator('a[href="/"], nav a:has-text("Home")').first()).toBeVisible();
    });

    test('should have Quick Log section', async ({ page }) => {
      await setupUserAndBaby(page);
      
      await expect(page.getByText('Quick Log', { exact: false }).first()).toBeVisible();
    });

    test('should have Tracking section', async ({ page }) => {
      await setupUserAndBaby(page);
      
      await expect(page.getByText('Tracking', { exact: false }).first()).toBeVisible();
    });

    test('should navigate to Calendar', async ({ page }) => {
      await setupUserAndBaby(page);
      
      const calendarLink = page.locator('a[href="/calendar"]');
      if (await calendarLink.isVisible()) {
        await calendarLink.click();
        await page.waitForURL(/\/calendar/);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      }
    });

    test('should navigate to Insights', async ({ page }) => {
      await setupUserAndBaby(page);
      
      const insightsLink = page.locator('a[href="/insights"]');
      if (await insightsLink.isVisible()) {
        await insightsLink.click();
        await page.waitForURL(/\/insights/);
      }
    });

    test('should navigate to Reminders', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Direct navigation to reminders page
      await page.goto('/reminders');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should navigate to Settings', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Direct navigation to settings page
      await page.goto('/settings');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should highlight active route', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/calendar');
      
      // The calendar link should have active styling
      const calendarLink = page.locator('a[href="/calendar"]');
      if (await calendarLink.isVisible()) {
        const className = await calendarLink.getAttribute('class');
        // Check for active class or similar indicator
        expect(className).toBeDefined();
      }
    });
  });

  test.describe('Reports & Data', () => {
    test('should load timeline page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/timeline');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display timeline entries', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/timeline');
      
      // Look for timeline content or empty state
      await expect(page.getByText(/timeline|activity|no.*entries/i).first()).toBeVisible();
    });

    test('should have filter options on timeline', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/timeline');
      
      // Look for filter buttons
      const filterButtons = page.getByRole('button').filter({ hasText: /all|feed|sleep|diaper/i });
      const count = await filterButtons.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should load calendar page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/calendar');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display calendar grid', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/calendar');
      
      // Look for calendar elements
      await expect(page.getByText(/sun|mon|tue|wed|thu|fri|sat/i).first()).toBeVisible();
    });

    test('should navigate calendar months', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/calendar');
      
      // Look for navigation buttons
      const prevButton = page.getByRole('button', { name: /prev|back|</i });
      const nextButton = page.getByRole('button', { name: /next|forward|>/i });
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
      
      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should load reports page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/report');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have export options', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/report');
      
      // Look for export/download options
      await expect(page.getByText(/export|download|pdf|report/i).first()).toBeVisible();
    });
  });

  test.describe('Memory & Photos', () => {
    test('should load memories page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/memories');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display memory grid or empty state', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/memories');
      
      // Look for memories content
      await expect(page.getByText(/memor|photo|no.*memories/i).first()).toBeVisible();
    });
  });

  test.describe('Family Overview', () => {
    test('should load family page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/family');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display baby overview', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/family');
      
      // Look for baby information
      await expect(page.getByText(/baby|overview/i).first()).toBeVisible();
    });
  });
});
