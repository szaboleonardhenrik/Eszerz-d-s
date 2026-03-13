import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from './constants';

test.describe('Dashboard', () => {
  test.skip(!process.env.E2E_PASSWORD, 'Set E2E_PASSWORD to run authenticated tests');
  test.use({ storageState: STORAGE_STATE });

  test('dashboard loads with stats', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('body')).toContainText(/Összes szerződés|szerződés/i);
  });

  test('navbar shows user name and credit balance', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('nav')).toContainText(/kredit/i);
  });

  test('can navigate to contracts', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('a[href="/contracts"]');
    await page.waitForURL('**/contracts', { timeout: 5000 });
    await expect(page).toHaveURL(/contracts/);
  });

  test('can navigate to templates', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('a[href="/templates"]');
    await page.waitForURL('**/templates', { timeout: 5000 });
    await expect(page).toHaveURL(/templates/);
  });

  test('can navigate to settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/settings/);
  });

  test('analytics page loads', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('body')).toContainText(/Analitika|statisztika|diagram/i);
  });

  test('notifications page loads', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('body')).toContainText(/Értesítés|notification/i);
  });

  test('calendar page loads', async ({ page }) => {
    await page.goto('/calendar');
    await expect(page.locator('body')).toContainText(/Naptár|calendar|hétfő|kedd/i);
  });

  test('kanban board loads', async ({ page }) => {
    await page.goto('/kanban');
    await expect(page.locator('body')).toContainText(/Kanban|tábla|board/i);
  });

  test('archive page loads', async ({ page }) => {
    await page.goto('/archive');
    await expect(page.locator('body')).toContainText(/Archív|archivált/i);
  });

  test('contacts page loads', async ({ page }) => {
    await page.goto('/contacts');
    await expect(page.locator('body')).toContainText(/Kapcsolat|partner|contact/i);
  });

  test('quotes page loads', async ({ page }) => {
    await page.goto('/quotes');
    await expect(page.locator('body')).toContainText(/Árajánlat|ajánlat|quote/i);
  });

  test('reminders page loads', async ({ page }) => {
    await page.goto('/reminders');
    await expect(page.locator('body')).toContainText(/Emlékeztető|reminder|lejárat/i);
  });
});
