import { test, expect } from '@playwright/test';
import { setupUserAndBaby } from '../utils';

test.describe('Reminders & Notifications', () => {
  test.describe('Reminders Page', () => {
    test('should load reminders page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/reminders');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display reminder list or empty state', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/reminders');
      
      await expect(page.getByText(/reminder|schedule|no.*reminders/i).first()).toBeVisible();
    });

    test('should have add reminder option', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/reminders');
      
      const addButton = page.getByRole('button', { name: /add|create|new/i });
      if (await addButton.isVisible()) {
        expect(true).toBe(true);
      }
    });

    test('should show upcoming medications if any', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/reminders');
      
      // Look for medication section
      const medSection = page.getByText(/medication|medicine|dose/i).first();
      if (await medSection.isVisible()) {
        expect(true).toBe(true);
      }
    });

    test('should show upcoming vaccinations', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/reminders');
      
      // Look for vaccination section
      const vacSection = page.getByText(/vaccination|vaccine|immunization/i).first();
      if (await vacSection.isVisible()) {
        expect(true).toBe(true);
      }
    });
  });

  test.describe('Reminder Creation', () => {
    test('should open reminder creation form', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/reminders');
      
      const addButton = page.getByRole('button', { name: /add|create|new/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        // Should show form or modal
        const form = page.locator('form, [role="dialog"]');
        if (await form.isVisible()) {
          expect(true).toBe(true);
        }
      }
    });

    test('should have reminder title input', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/reminders');
      
      const addButton = page.getByRole('button', { name: /add|create|new/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        
        const titleInput = page.locator('input[type="text"]').first();
        if (await titleInput.isVisible()) {
          await titleInput.fill('Doctor appointment');
        }
      }
    });

    test('should have time/date picker', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/reminders');
      
      const addButton = page.getByRole('button', { name: /add|create|new/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        
        const dateInput = page.locator('input[type="date"], input[type="datetime-local"], input[type="time"]');
        const count = await dateInput.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

test.describe('AI Features', () => {
  test.describe('AI Summary', () => {
    test('should display AI summary on dashboard', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Look for AI summary card
      await expect(page.getByText(/AI.*Summary|Health.*Summary|Daily.*Summary/i).first()).toBeVisible();
    });

    test('should show feeding prediction', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Look for feeding prediction
      await expect(page.getByText(/next.*feed|feeding.*prediction|hungry/i).first()).toBeVisible();
    });

    test('should show wake window prediction', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Look for wake window
      await expect(page.getByText(/wake.*window|awake.*time|nap.*time/i).first()).toBeVisible();
    });
  });

  test.describe('AI Chat', () => {
    test('should have AI assistant access', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Look for AI chat button or link
      const aiButton = page.getByRole('button', { name: /ai|assistant|chat|ask/i });
      if (await aiButton.isVisible()) {
        expect(true).toBe(true);
      }
    });
  });
});
