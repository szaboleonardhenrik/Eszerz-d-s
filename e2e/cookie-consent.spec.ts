import { test, expect } from '@playwright/test';

test.describe('Cookie Consent (GDPR)', () => {
  test('cookie banner appears on first visit', async ({ page }) => {
    await page.goto('/landing');
    await page.evaluate(() => localStorage.removeItem('cookie_consent'));
    await page.reload();

    await expect(page.locator('text=/cookie|süti/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('cookie banner has accept and decline options', async ({ page }) => {
    await page.goto('/landing');
    await page.evaluate(() => localStorage.removeItem('cookie_consent'));
    await page.reload();

    await expect(page.locator('button:has-text("Elfogadom")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Csak szükségesek")')).toBeVisible();
  });

  test('accepting cookies stores preference and hides banner', async ({ page }) => {
    await page.goto('/landing');
    await page.evaluate(() => localStorage.removeItem('cookie_consent'));
    await page.reload();

    await page.locator('button:has-text("Elfogadom")').click();

    const consent = await page.evaluate(() => localStorage.getItem('cookie_consent'));
    expect(consent).toBe('accepted');

    // Banner should be hidden
    await expect(page.locator('text="Elfogadom"')).not.toBeVisible();
  });

  test('declining cookies stores essential_only', async ({ page }) => {
    await page.goto('/landing');
    await page.evaluate(() => localStorage.removeItem('cookie_consent'));
    await page.reload();

    await page.locator('button:has-text("Csak szükségesek")').click();

    const consent = await page.evaluate(() => localStorage.getItem('cookie_consent'));
    expect(consent).toBe('essential_only');
  });

  test('cookie consent can be withdrawn (GDPR 7(3))', async ({ page }) => {
    await page.goto('/landing');
    await page.evaluate(() => localStorage.setItem('cookie_consent', 'accepted'));
    await page.reload();

    // "Cookie beállítások" button should be visible for withdrawal
    const settingsButton = page.locator('button:has-text("Cookie beállítások")');
    await expect(settingsButton).toBeVisible({ timeout: 5000 });

    // Clicking it should show the banner again
    await settingsButton.click();
    await expect(page.locator('button:has-text("Elfogadom")')).toBeVisible();

    // localStorage should be cleared
    const consent = await page.evaluate(() => localStorage.getItem('cookie_consent'));
    expect(consent).toBeNull();
  });
});
