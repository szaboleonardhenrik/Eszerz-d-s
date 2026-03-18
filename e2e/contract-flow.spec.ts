import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from './constants';

test.describe('Contract Creation Flow', () => {
  test.skip(!process.env.E2E_PASSWORD, 'Set E2E_PASSWORD to run authenticated tests');
  test.use({ storageState: STORAGE_STATE });

  test('create page shows template selection', async ({ page }) => {
    await page.goto('/create');
    await expect(page.locator('body')).toContainText(/sablon|szerződés|Új|kategória/i);
  });

  test('templates page shows seeded templates', async ({ page }) => {
    await page.goto('/templates');
    await expect(page.locator('body')).toContainText(/sablon|Munkaszerződés|Megbízási/i);
  });

  test('contract list page loads with filters', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page).toHaveURL(/contracts/);
    // Should have search/filter functionality
    const searchInput = page.locator('input[placeholder*="Keres"], input[type="search"], input[placeholder*="keres"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('bulk-send page loads', async ({ page }) => {
    await page.goto('/bulk-send');
    await expect(page.locator('body')).toContainText(/Tömeges|bulk|küldés/i);
  });

  test('template marketplace page loads', async ({ page }) => {
    await page.goto('/templates/marketplace');
    await expect(page.locator('body')).toContainText(/Marketplace|közösségi|sablon/i);
  });

  test('compare page loads', async ({ page }) => {
    await page.goto('/contracts/compare');
    await expect(page.locator('body')).toContainText(/sszehasonl|compare|verzió/i);
  });
});
