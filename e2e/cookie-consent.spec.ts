import { test, expect } from '@playwright/test';

test.describe('Cookie Consent (GDPR)', () => {
  test('cookie banner appears on first visit', async ({ page }) => {
    await page.goto('/landing');
    await page.evaluate(() => localStorage.removeItem('cookie_consent'));
    await page.reload();

    await expect(page.locator('text=/cookie|süti/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('cookie banner has accept all and settings options', async ({ page }) => {
    await page.goto('/landing');
    await page.evaluate(() => localStorage.removeItem('cookie_consent'));
    await page.reload();

    await expect(page.locator('button:has-text("Elfogadom")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Beállítások")')).toBeVisible();
    await expect(page.locator('button:has-text("Csak szükségesek")')).toBeVisible();
  });

  test('accepting all cookies stores preference and hides banner', async ({ page }) => {
    await page.goto('/landing');
    await page.evaluate(() => localStorage.removeItem('cookie_consent'));
    await page.reload();

    await page.locator('button:has-text("Elfogadom")').click();

    const consent = await page.evaluate(() => localStorage.getItem('cookie_consent'));
    const parsed = JSON.parse(consent!);
    expect(parsed.essential).toBe(true);
    expect(parsed.functional).toBe(true);
    expect(parsed.analytics).toBe(true);

    // Banner should be hidden
    await expect(page.locator('button:has-text("Elfogadom")')).not.toBeVisible();
  });

  test('saving with only essentials stores minimal preferences', async ({ page }) => {
    await page.goto('/landing');
    await page.evaluate(() => localStorage.removeItem('cookie_consent'));
    await page.reload();

    // Open settings
    await page.locator('button:has-text("Beállítások")').click();
    // Save with default (only essential checked)
    await page.locator('button:has-text("Mentés")').click();

    const consent = await page.evaluate(() => localStorage.getItem('cookie_consent'));
    const parsed = JSON.parse(consent!);
    expect(parsed.essential).toBe(true);
    expect(parsed.functional).toBe(false);
    expect(parsed.analytics).toBe(false);
  });

  test('cookie consent can be withdrawn (GDPR 7(3))', async ({ page }) => {
    await page.goto('/landing');
    await page.evaluate(() => localStorage.setItem('cookie_consent', JSON.stringify({ essential: true, functional: true, analytics: true })));
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
