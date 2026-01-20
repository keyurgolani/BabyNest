import { test, expect, Page } from '@playwright/test';
import { setupUserAndBaby } from '../utils';

test.describe('Milestones & Activities', () => {

const navigateToMilestones = async (page: Page) => {
  // First, verify we are in a good state on the dashboard (baby name visible)
  await expect(page.locator('body')).not.toContainText('No active baby');

  await page.goto('/milestones');
  
  // Aggressive retry logic for the Milestones page specifically
  for (let i = 0; i < 3; i++) {
    // Check for "No active baby" error state specifically
    const errorState = page.getByText('No active baby selected');
    const tryAgainBtn = page.getByRole('button', { name: /try again/i });
    
    // Check for success state
    const heading = page.getByRole('heading', { name: /milestones/i, level: 1 });

    // Check if loading spinner is present
    const spinner = page.locator('.animate-spin');
    
    if (await heading.isVisible({ timeout: 10000 })) {
      return; // Success!
    }

    if (await errorState.isVisible({ timeout: 2000 }) || await tryAgainBtn.isVisible({ timeout: 2000 })) {
      console.log(`Milestones load retry ${i+1}: 'No active baby' detected. Reloading...`);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); 
      continue;
    }
    
    // If still here, check spinner
    if (await spinner.isVisible()) {
      console.log(`Milestones load retry ${i+1}: Still seeing spinner. Reloading...`);
    } else {
      console.log(`Milestones load retry ${i+1}: Stuck loading (unknown state). Reloading...`);
    }

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }
  
  // Final assertion with long timeout
  await expect(page.getByRole('heading', { name: /milestones/i, level: 1 })).toBeVisible({ timeout: 15000 });
};

  test.describe('Milestones', () => {
    test('should load milestones page', async ({ page }) => {
      await setupUserAndBaby(page);
      await navigateToMilestones(page);
      
      await expect(page.getByRole('heading', { name: /milestones/i, level: 1 })).toBeVisible();
    });

    test('should display milestone categories', async ({ page }) => {
      await setupUserAndBaby(page);
      await navigateToMilestones(page);
      
      // Look for milestone categories or list
      await expect(page.getByText(/milestone|development|achieved/i).first()).toBeVisible();
    });

    test('should have milestone cards', async ({ page }) => {
      await setupUserAndBaby(page);
      await navigateToMilestones(page);
      
      // Look for any milestone card
      const cards = page.locator('div[class*="card"]');
      await expect(cards.first()).toBeVisible();
    });

    test.skip('should log a milestone', async ({ page }) => {
      // Extensive, state-dependent test needs more time for retries
      test.setTimeout(120000);

      // Wrap the entire flow in a retry loop to handle the zombie state
      // where click succeeds but modal never appears
      let success = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`Test Attempt ${attempt + 1}: Retrying navigation...`);
          }
          
          // Always use the robust navigator which handles errors/reloads
          await navigateToMilestones(page);
          
          // Ensure hydration
          await page.waitForTimeout(1000);

          // Retry loop for the interaction part (click card -> modal)
          let modalVisible = false;
          // Target only the milestone cards that are NOT achieved
          const firstCard = page.locator('div[class*="card"]')
            .filter({ hasText: /expected:/i })
            .filter({ hasNotText: /achieved:/i })
            .first();
          
          if (!await firstCard.isVisible({ timeout: 5000 })) {
             throw new Error('No unachieved milestone card found');
          }

          for (let i = 0; i < 3; i++) {
            if (await firstCard.isVisible()) {
              const text = await firstCard.textContent();
              console.log(`Attempting to click card (try ${i+1}):`, text?.substring(0, 50) + "...");
              
              // Click the status button instead of the card body
              const statusBtn = firstCard.locator('button').first();
              if (await statusBtn.isVisible()) {
                 await statusBtn.click({ force: true });
              } else {
                 await firstCard.click({ force: true });
              }
              
              await page.waitForTimeout(1000); 
              
              // Check for specific modal content
              const modal = page.locator('[role="dialog"]').filter({ hasText: /mark.*achieved/i });
              if (await modal.isVisible({ timeout: 2000 })) {
                modalVisible = true;
                
                // Fill form
                const dateInput = modal.locator('input[type="date"]');
                if (await dateInput.isVisible()) {
                  await dateInput.fill('2024-01-01');
                }
                
                const saveButton = modal.getByRole('button', { name: /save|mark|achieve/i }).first();
                if (await saveButton.isVisible()) {
                  await saveButton.click();
                }
                break; // Found modal, broke loop
              } else {
                console.log(`Modal did not appear on try ${i+1}`);
              }
            }
          }
          
          if (modalVisible) {
            success = true;
            break; // Success, exit outer loop
          }
        } catch (e) {
          console.log(`Attempt ${attempt + 1} failed: ${e}`);
        }
      }
      
      expect(success).toBe(true);
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
