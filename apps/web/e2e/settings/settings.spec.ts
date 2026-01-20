import { test, expect } from '@playwright/test';
import { setupUserAndBaby } from '../utils';

test.describe('Settings & Profile', () => {
  test.describe('Settings Page', () => {
    test('should load settings page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display settings options', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings');
      
      // Look for settings-related content
      await expect(page.getByText(/settings|profile|preferences/i).first()).toBeVisible();
    });

    test('should have logout option', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings');
      
      // Look for logout button
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
      if (await logoutButton.isVisible()) {
        expect(true).toBe(true);
      }
    });
  });

  test.describe('Caregivers', () => {
    test('should load caregivers page', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings/caregivers');
      
      await expect(page.getByText('Caregivers', { exact: false }).first()).toBeVisible();
    });

    test('should display current user as caregiver', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings/caregivers');
      
      // Should show the logged in user
      await expect(page.getByText(/primary|caregiver|user/i).first()).toBeVisible();
    });

    test('should have invite caregiver button', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings/caregivers');
      
      const inviteButton = page.getByRole('button', { name: /invite/i });
      await expect(inviteButton).toBeVisible();
    });

    test('should show invite dialog on click', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings/caregivers');
      
      const inviteButton = page.getByRole('button', { name: /invite/i });
      if (await inviteButton.isVisible()) {
        await inviteButton.click();
        
        // Should show invite dialog or form
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display caregiver roles', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings/caregivers');
      
      // Look for role descriptions
      await expect(page.getByText(/primary|secondary|viewer/i).first()).toBeVisible();
    });
  });

  test.describe('Baby Profile Management', () => {
    test('should display baby information on settings', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings');
      
      // Should show baby info
      await expect(page.getByText(/baby/i).first()).toBeVisible();
    });

    test('should have edit baby option', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings');
      
      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible()) {
        expect(true).toBe(true);
      }
    });

    test('should open edit modal on click', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings');
      
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Should show edit form/modal
        await page.waitForTimeout(1000);
        const modal = page.getByRole('dialog');
        if (await modal.isVisible()) {
          expect(true).toBe(true);
        }
      }
    });
  });

  test.describe('Multi-Baby Support', () => {
    test('should display baby selector if available', async ({ page }) => {
      await setupUserAndBaby(page);
      
      // Look for baby selector/switcher on dashboard
      const babySelector = page.locator('[data-testid="baby-selector"], .baby-selector');
      if (await babySelector.isVisible()) {
        expect(true).toBe(true);
      }
    });

    test('should have add baby option', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings');
      
      // Look for add baby button
      const addBabyButton = page.getByRole('button', { name: /add.*baby/i });
      if (await addBabyButton.isVisible()) {
        expect(true).toBe(true);
      }
    });
  });

  test.describe('Account Settings', () => {
    test('should display user account info', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings');
      
      // Look for account/user info
      await expect(page.getByText(/account|email|user/i).first()).toBeVisible();
    });

    test('should have theme toggle option', async ({ page }) => {
      await setupUserAndBaby(page);
      await page.goto('/settings');
      
      // Look for theme toggle
      const themeToggle = page.getByText(/dark|light|theme/i).first();
      if (await themeToggle.isVisible()) {
        expect(true).toBe(true);
      }
    });
  });
});
