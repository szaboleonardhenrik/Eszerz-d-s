import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_EMAIL || 'teszt2@legitas.hu';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'Test1234!';

test.describe('Contract Creation Flow', () => {
  test.skip(!process.env.E2E_PASSWORD, 'Set E2E_PASSWORD env var to run authenticated tests');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('can access create page', async ({ page }) => {
    await page.goto('/create');
    await page.waitForTimeout(2000);
    // Should show template selection or creation form
    await expect(page.locator('body')).toContainText(/sablon|szerződés|Új/i);
  });

  test('templates page shows available templates', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForTimeout(2000);
    // Should show at least one template
    await expect(page.locator('body')).toContainText(/sablon|Munkaszerződés|Megbízási/i);
  });

  test('contract list page loads', async ({ page }) => {
    await page.goto('/contracts');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/contracts/);
  });
});
