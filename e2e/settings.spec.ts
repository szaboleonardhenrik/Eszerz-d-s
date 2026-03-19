import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from './constants';

test.describe('Settings Pages', () => {
  test.skip(!process.env.E2E_PASSWORD, 'Set E2E_PASSWORD to run authenticated tests');
  test.use({ storageState: STORAGE_STATE });

  test('settings main page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/settings/);
    await expect(page.locator('body')).toContainText(/Profil|Beállítások|profil/i);
  });

  test('security settings page loads', async ({ page }) => {
    await page.goto('/settings/security');
    await expect(page.locator('body')).toContainText(/Jelszó|Kétfaktoros|2FA/i);
  });

  test('billing page shows plans and credits', async ({ page }) => {
    await page.goto('/settings/billing');
    await expect(page.locator('body')).toContainText(/Kreditek|kredit|előfizetés/i);
    await expect(page.locator('body')).toContainText(/szerződés/i);
  });

  test('team management page loads or requires upgrade', async ({ page }) => {
    await page.goto('/settings/team');
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      await expect(page.locator('body')).toContainText(/Csapat|meghívás|tag/i);
    }
  });

  test('API keys page loads or requires upgrade', async ({ page }) => {
    await page.goto('/settings/api');
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      await expect(page.locator('body')).toContainText(/API|kulcs|key/i);
    }
  });

  test('webhooks page loads or requires upgrade', async ({ page }) => {
    await page.goto('/settings/webhooks');
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      await expect(page.locator('body')).toContainText(/Webhook/i);
    }
  });

  test('notification preferences page loads', async ({ page }) => {
    await page.goto('/settings/notifications');
    await expect(page.locator('body')).toContainText(/Értesítés|notification|email/i);
  });

  // These pages may require a higher subscription tier.
  // For a free-tier test user, redirect to login or an upgrade prompt is expected.
  test('referral page loads or requires upgrade', async ({ page }) => {
    await page.goto('/settings/referral');
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      await expect(page.locator('body')).toContainText(/Ajánl|referral|meghívó/i);
    }
  });

  test('branding page loads or requires upgrade', async ({ page }) => {
    await page.goto('/settings/branding');
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      await expect(page.locator('body')).toContainText(/Branding|logó|arculat|cég/i);
    }
  });

  test('tags page loads or requires upgrade', async ({ page }) => {
    await page.goto('/settings/tags');
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      await expect(page.locator('body')).toContainText(/Címke|tag/i);
    }
  });
});
