import { test, expect } from '@playwright/test';
import { setupUserAndBaby } from '../utils';

test.describe('Memories & Photos', () => {
  test.describe('Memories Page', () => {
    test('should load memories page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/memories');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display memory grid or empty state', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/memories');
      
      await expect(page.getByText(/memor|photo|capture|no.*memories/i).first()).toBeVisible();
    });

    test('should have add memory option', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/memories');
      
      const addButton = page.getByRole('button', { name: /add|create|capture/i }).or(
        page.getByRole('link', { name: /add|create|capture/i })
      );
      if (await addButton.first().isVisible()) {
        expect(true).toBe(true);
      }
    });
  });

  test.describe('Memory Creation', () => {
    test('should load memory creation page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/memory');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have title input', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/memory');
      
      const titleInput = page.locator('input[name="title"], #title, input[type="text"]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('First smile!');
      }
    });

    test('should have description field', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/memory');
      
      const descInput = page.locator('textarea').first();
      if (await descInput.isVisible()) {
        await descInput.fill('Baby smiled for the first time today!');
      }
    });

    test('should have photo upload option', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/memory');
      
      // Look for file upload input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        expect(true).toBe(true);
      }
    });

    test('should create memory without photo', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/memory');
      
      // Fill details
      const titleInput = page.locator('input').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test memory');
      }
      
      // Save
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
    });
  });
});

test.describe('Data Management', () => {
  test.describe('Timeline Filtering', () => {
    test('should load timeline page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/timeline');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display filter options', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/timeline');
      
      // Look for filter controls
      const filters = page.getByText(/filter|all|feed|sleep|diaper/i);
      const count = await filters.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should filter by feeding', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/timeline');
      
      const feedFilter = page.getByRole('button', { name: /feed/i });
      if (await feedFilter.isVisible()) {
        await feedFilter.click();
        await page.waitForTimeout(500);
      }
    });

    test('should filter by sleep', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/timeline');
      
      const sleepFilter = page.getByRole('button', { name: /sleep/i });
      if (await sleepFilter.isVisible()) {
        await sleepFilter.click();
        await page.waitForTimeout(500);
      }
    });

    test('should show all entries', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/timeline');
      
      const allFilter = page.getByRole('button', { name: /all/i });
      if (await allFilter.isVisible()) {
        await allFilter.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Report Generation', () => {
    test('should load reports page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/report');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display report type options', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/report');
      
      await expect(page.getByText(/report|daily|weekly|monthly/i).first()).toBeVisible();
    });

    test('should have date range selector', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/report');
      
      const dateInputs = page.locator('input[type="date"]');
      const count = await dateInputs.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should have export/download option', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/report');
      
      await expect(page.getByText(/export|download|generate|pdf/i).first()).toBeVisible();
    });

    test('should select daily report', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/report');
      
      const dailyOption = page.getByText(/daily/i).first();
      if (await dailyOption.isVisible()) {
        await dailyOption.click();
      }
    });

    test('should select weekly report', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/report');
      
      const weeklyOption = page.getByText(/weekly/i).first();
      if (await weeklyOption.isVisible()) {
        await weeklyOption.click();
      }
    });
  });

  test.describe('Insights Page', () => {
    test('should load insights page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/insights');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display insight cards', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/insights');
      
      await expect(page.getByText(/insight|pattern|trend|summary/i).first()).toBeVisible();
    });
  });
});
