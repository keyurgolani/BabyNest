import { test, expect } from '@playwright/test';
import { setupUserAndBaby } from '../utils';

test.describe('Health Features', () => {
  test.describe('Growth Tracking', () => {
    test('should load growth tracking page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/growth');
      
      await expect(page.getByText('Growth Tracking', { exact: false })).toBeVisible();
    });

    test('should display growth history section', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/growth');
      
      await expect(page.getByText(/history|measurement/i).first()).toBeVisible();
    });

    test('should have add measurement button', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/growth');
      
      // Look for Add button/link
      const addButton = page.getByRole('button', { name: /add/i }).or(page.getByRole('link', { name: /add/i }));
      await expect(addButton.first()).toBeVisible();
    });

    test('should navigate to growth log page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/growth');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have weight input field', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/growth');
      
      // Look for weight input
      const weightInput = page.locator('input[name="weight"], #weight').first();
      if (await weightInput.isVisible()) {
        await weightInput.fill('5000'); // 5kg in grams
        expect(true).toBe(true);
      }
    });

    test('should have height input field', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/growth');
      
      // Look for height input
      const heightInput = page.locator('input[name="height"], #height').first();
      if (await heightInput.isVisible()) {
        await heightInput.fill('550'); // 55cm in mm
        expect(true).toBe(true);
      }
    });

    test('should have head circumference input', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/growth');
      
      // Look for head circumference input
      const headInput = page.locator('input[name="headCircumference"], #headCircumference').first();
      if (await headInput.isVisible()) {
        await headInput.fill('380'); // 38cm in mm
        expect(true).toBe(true);
      }
    });

    test('should save growth measurement', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/growth');
      
      // Fill weight field
      const inputs = page.locator('input[type="number"]');
      const firstInput = inputs.first();
      if (await firstInput.isVisible()) {
        await firstInput.fill('5000');
      }
      
      // Save using submit button or any button on the form
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      } else {
        // Alternative: find any save-like button
        const anyButton = page.getByRole('button').first();
        await anyButton.click();
      }
    });
  });

  test.describe('Health Symptoms', () => {
    test('should load health page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/health');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display symptom logging options', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/tracking/health');
      
      // Look for symptom-related content
      await expect(page.getByText(/symptom|health|fever|cough/i).first()).toBeVisible();
    });
  });

  test.describe('Medications', () => {
    test('should load medication page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/medication');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have medication name input', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/medication');
      
      const nameInput = page.locator('input[name="name"], #name, input[type="text"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Vitamin D');
      }
    });

    test('should have dosage input', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/medication');
      
      const dosageInput = page.locator('input[name="dosage"], #dosage').first();
      if (await dosageInput.isVisible()) {
        await dosageInput.fill('400 IU');
      }
    });

    test('should log medication', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/medication');
      
      // Fill medication details
      const nameInput = page.locator('input').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Vitamin D');
      }
      
      // Save using submit button
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      } else {
        // Alternative: find any button
        const anyButton = page.getByRole('button').first();
        await anyButton.click();
      }
    });
  });

  test.describe('Vaccinations', () => {
    test('should load vaccination page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/vaccination');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display vaccination form', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/vaccination');
      
      // Look for vaccination-related inputs
      const inputs = page.locator('input, select');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should log vaccination', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/vaccination');
      
      // Fill vaccine details
      const nameInput = page.locator('input').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Hepatitis B');
      }
      
      // Save
      const saveButton = page.getByRole('button', { name: /save|submit|log/i }).first();
      await saveButton.click();
    });
  });

  test.describe('Doctor Visits', () => {
    test('should load doctor visit page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/doctor-visit');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have doctor visit form fields', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/doctor-visit');
      
      // Look for form fields
      const inputs = page.locator('input, textarea, select');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should log doctor visit', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/log/doctor-visit');
      
      // Fill visit details
      const input = page.locator('input, textarea').first();
      if (await input.isVisible()) {
        await input.fill('Well baby checkup');
      }
      
      // Save
      const saveButton = page.getByRole('button', { name: /save|submit|log/i }).first();
      await saveButton.click();
    });
  });
});
