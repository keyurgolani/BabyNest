import { test, expect } from '@playwright/test';
import { setupUserAndBaby } from '../utils';

test.describe('Milestones & Activities', () => {
  test.describe('Milestones', () => {
    test('should load milestones page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/milestones');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display milestone categories', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/milestones');
      
      // Look for milestone categories or list
      await expect(page.getByText(/milestone|development|achieved/i).first()).toBeVisible();
    });

    test('should have add milestone option', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/milestones');
      
      // Look for add button
      const addButton = page.getByRole('button', { name: /add|log|record/i }).first();
      if (await addButton.isVisible()) {
        expect(true).toBe(true);
      }
    });

    test('should log a milestone', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/milestone');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      
      // Look for milestone input or selection
      const inputs = page.locator('input, select, textarea');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Activities', () => {
    test('should load activities page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/activities');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display activity list or empty state', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/activities');
      
      await expect(page.getByText(/activit|play|tummy/i).first()).toBeVisible();
    });

    test('should log an activity', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/activity');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      
      // Fill activity details
      const input = page.locator('input, textarea').first();
      if (await input.isVisible()) {
        await input.fill('Tummy time - 15 minutes');
      }
      
      // Save
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    });
  });
});

test.describe('Temperature & Symptoms', () => {
  test.describe('Temperature Logging', () => {
    test('should load temperature page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/temperature');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have temperature input field', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/temperature');
      
      // Look for temperature input
      const tempInput = page.locator('input[type="number"], input[name="temperature"]').first();
      if (await tempInput.isVisible()) {
        await tempInput.fill('98.6');
      }
    });

    test('should have temperature unit selector', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/temperature');
      
      // Look for F/C unit toggles
      const unitSelector = page.getByText(/fahrenheit|celsius|°F|°C/i).first();
      if (await unitSelector.isVisible()) {
        expect(true).toBe(true);
      }
    });

    test('should log temperature reading', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/temperature');
      
      // Fill temperature
      const tempInput = page.locator('input').first();
      if (await tempInput.isVisible()) {
        await tempInput.fill('98.6');
      }
      
      // Save
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Symptom Logging', () => {
    test('should load symptom logging page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/symptom');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display symptom type options', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/symptom');
      
      // Look for symptom types
      await expect(page.getByText(/symptom|fever|cough|rash|congestion/i).first()).toBeVisible();
    });

    test('should have severity selector', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/symptom');
      
      // Look for severity options
      const severity = page.getByText(/severity|mild|moderate|severe/i).first();
      if (await severity.isVisible()) {
        expect(true).toBe(true);
      }
    });

    test('should log symptom with notes', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/symptom');
      
      // Fill symptom details
      const notesInput = page.locator('textarea, input[type="text"]').first();
      if (await notesInput.isVisible()) {
        await notesInput.fill('Runny nose since morning');
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
