import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  // Set a consistent viewport for reproducible screenshots
  test.use({ viewport: { width: 1280, height: 720 } });

  test('landing page visual', async ({ page }) => {
    await page.goto('/landing');
    // Dismiss cookie banner for consistent screenshots
    const cookieBtn = page.locator('[data-testid="cookie-accept-all"], button:has-text("Elfogadom")').first();
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(500);
    }
    await expect(page).toHaveScreenshot('landing.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: false
    });
  });

  test('pricing page visual', async ({ page }) => {
    await page.goto('/pricing');
    const cookieBtn = page.locator('[data-testid="cookie-accept-all"], button:has-text("Elfogadom")').first();
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(500);
    }
    await expect(page).toHaveScreenshot('pricing.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: false
    });
  });

  test('login page visual', async ({ page }) => {
    await page.goto('/login');
    const cookieBtn = page.locator('[data-testid="cookie-accept-all"], button:has-text("Elfogadom")').first();
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(500);
    }
    await expect(page).toHaveScreenshot('login.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: false
    });
  });

  test('register page visual', async ({ page }) => {
    await page.goto('/register');
    const cookieBtn = page.locator('[data-testid="cookie-accept-all"], button:has-text("Elfogadom")').first();
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(500);
    }
    await expect(page).toHaveScreenshot('register.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: false
    });
  });

  test('blog page visual', async ({ page }) => {
    await page.goto('/blog');
    const cookieBtn = page.locator('[data-testid="cookie-accept-all"], button:has-text("Elfogadom")').first();
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(500);
    }
    await expect(page).toHaveScreenshot('blog.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: false
    });
  });
});
