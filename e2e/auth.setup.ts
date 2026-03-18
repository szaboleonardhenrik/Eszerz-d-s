import { test as setup, expect } from '@playwright/test';
import { STORAGE_STATE } from './constants';

const TEST_EMAIL = process.env.E2E_EMAIL || 'teszt2@legitas.hu';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'Test1234!';

setup('authenticate', async ({ page }) => {
  setup.skip(!process.env.E2E_PASSWORD, 'Set E2E_PASSWORD to run authenticated tests');

  await page.goto('/login');

  // Dismiss cookie banner if present (it can block the login button)
  const cookieAccept = page.locator('button', { hasText: 'Elfogadom' });
  if (await cookieAccept.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cookieAccept.click();
    await page.waitForTimeout(500);
  }

  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.locator('button', { hasText: 'Bejelentkezés' }).first().click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await expect(page).toHaveURL(/dashboard/);

  await page.context().storageState({ path: STORAGE_STATE });
});
