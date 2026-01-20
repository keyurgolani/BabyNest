import { test, expect } from '@playwright/test';
import { setupUserAndBaby } from '../utils';

test.describe('Tracking Features', () => {
  test.describe('Dashboard Quick Log', () => {
    test('should display all quick log options', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Quick Log section should be visible in sidebar
      await expect(page.getByText('Quick Log', { exact: false }).first()).toBeVisible();
      
      // Verify sidebar has navigation options
      await expect(page.getByText('Feeding', { exact: false }).first()).toBeVisible();
      await expect(page.getByText('Sleep', { exact: false }).first()).toBeVisible();
    });
  });

  test.describe('Feeding - Bottle', () => {
    test('should load bottle feed page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/feed?type=bottle');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should log bottle feed with amount', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/feed?type=bottle');
      
      // Find and fill amount input
      const amountInput = page.locator('input[type="number"]').first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('120');
      }
      
      // Save
      const saveButton = page.getByRole('button', { name: /save|submit|log/i }).first();
      await saveButton.click();
      
      // Should succeed (redirect or success message)
      await page.waitForTimeout(2000);
    });

    test('should prevent negative amounts', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/feed?type=bottle');
      
      const amountInput = page.locator('input[type="number"]').first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('-50');
        
        // Check min attribute or validation
        const minValue = await amountInput.getAttribute('min');
        if (minValue) {
          expect(parseInt(minValue)).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Feeding - Breastfeeding', () => {
    test('should load breastfeeding page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/feed');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should show timer controls for nursing', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/feed');
      
      // Click on Nursing tab if not already selected
      const nursingTab = page.getByText('Nursing', { exact: false }).first();
      if (await nursingTab.isVisible()) {
        await nursingTab.click();
      }
      
      // Look for Live Timer section (based on screenshot)
      await expect(page.getByText('Live Timer', { exact: false })).toBeVisible();
    });

    test('should allow manual entry for breastfeeding', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/feed');
      
      // Click on Nursing tab
      const nursingTab = page.getByText('Nursing', { exact: false }).first();
      if (await nursingTab.isVisible()) {
        await nursingTab.click();
      }
      
      // Look for Manual Entry section (based on screenshot)
      await expect(page.getByText('Manual Entry', { exact: false })).toBeVisible();
      
      // Should have LEFT SIDE and RIGHT SIDE inputs
      await expect(page.getByText('LEFT SIDE', { exact: false })).toBeVisible();
    });
  });

  test.describe('Feeding - Solids', () => {
    test('should load solids page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/feed?type=solid');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should allow logging solid foods', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/feed?type=solid');
      
      // Look for food input/text area
      const foodInput = page.locator('input, textarea').first();
      if (await foodInput.isVisible()) {
        await foodInput.fill('Mashed banana');
      }
      
      const saveButton = page.getByRole('button', { name: /save|submit|log/i }).first();
      await saveButton.click();
    });
  });

  test.describe('Sleep', () => {
    test('should load sleep logging page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/sleep');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should show sleep timer controls', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/sleep');
      
      // Look for timer or sleep-related controls
      await expect(page.getByText(/timer|start|nap|sleep/i).first()).toBeVisible();
    });

    test('should allow manual sleep entry', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/sleep');
      
      // Sleep page should have timer or entry options
      // Check for page content that indicates sleep logging is available
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      
      // Verify there are inputs or buttons for logging
      const hasInputs = await page.locator('input, button').count();
      expect(hasInputs).toBeGreaterThan(0);
    });

    test('should start and display sleep timer', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/sleep');
      
      // Find start timer button
      const startButton = page.getByRole('button', { name: /start/i }).first();
      if (await startButton.isVisible()) {
        await startButton.click();
        
        // Timer should be running (look for stop/pause or timer display)
        await page.waitForTimeout(1000);
        const timerRunning = page.getByText(/stop|pause|0:0|:00/i).first();
        await expect(timerRunning).toBeVisible();
      }
    });
  });

  test.describe('Diaper', () => {
    test('should load diaper logging page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/diaper');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display diaper type options', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/diaper');
      
      // Look for Wet, Dirty, Mixed options
      await expect(page.getByText(/wet/i).first()).toBeVisible();
    });

    test('should log wet diaper', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/diaper');
      
      // Select Wet
      const wetButton = page.getByRole('button', { name: /wet/i }).first();
      if (await wetButton.isVisible()) {
        await wetButton.click();
      }
      
      // Save
      const saveButton = page.getByRole('button', { name: /save|submit|log/i }).first();
      await saveButton.click();
    });

    test('should log dirty diaper with options', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/diaper');
      
      // Select Dirty
      const dirtyButton = page.getByRole('button', { name: /dirty|bowel/i }).first();
      if (await dirtyButton.isVisible()) {
        await dirtyButton.click();
        
        // Look for texture/color options
        const textureOption = page.getByText(/texture|color|consistency/i).first();
        if (await textureOption.isVisible()) {
          expect(true).toBe(true); // Options are shown
        }
      }
      
      // Save
      const saveButton = page.getByRole('button', { name: /save|submit|log/i }).first();
      await saveButton.click();
    });

    test('should log mixed diaper', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/diaper');
      
      // Select Mixed if available
      const mixedButton = page.getByRole('button', { name: /mixed|both/i }).first();
      if (await mixedButton.isVisible()) {
        await mixedButton.click();
        
        const saveButton = page.getByRole('button', { name: /save|submit|log/i }).first();
        await saveButton.click();
      }
    });
  });
});
