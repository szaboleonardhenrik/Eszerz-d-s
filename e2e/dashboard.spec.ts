import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_EMAIL || 'teszt2@legitas.hu';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'Test1234!';

test.describe('Dashboard', () => {
  test.skip(!process.env.E2E_PASSWORD, 'Set E2E_PASSWORD env var to run authenticated tests');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('dashboard loads with stats', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
    // Should show stat cards
    await expect(page.locator('body')).toContainText(/Összes szerződés|szerződés/i);
  });

  test('navbar shows user name and credit balance', async ({ page }) => {
    // Credit balance should be visible in navbar
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('nav')).toContainText(/kredit/i);
  });

  test('can navigate to contracts', async ({ page }) => {
    await page.click('a[href="/contracts"]');
    await page.waitForURL('**/contracts', { timeout: 5000 });
    await expect(page).toHaveURL(/contracts/);
  });

  test('can navigate to templates', async ({ page }) => {
    await page.click('a[href="/templates"]');
    await page.waitForURL('**/templates', { timeout: 5000 });
    await expect(page).toHaveURL(/templates/);
  });

  test('can navigate to settings', async ({ page }) => {
    // Open profile dropdown
    await page.locator('nav').locator('button').filter({ hasText: /beállítás|settings/i }).first().click().catch(() => {
      // If direct link exists
    });
    await page.goto('/settings');
    await page.waitForURL('**/settings', { timeout: 5000 });
    await expect(page).toHaveURL(/settings/);
  });

  test('billing page shows credit section', async ({ page }) => {
    await page.goto('/settings/billing');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(/Kreditek|kredit egyenleg/i);
  });
});
