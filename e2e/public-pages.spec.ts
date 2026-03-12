import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('landing page loads and has CTA', async ({ page }) => {
    await page.goto('/landing');
    await expect(page).toHaveTitle(/Legitas/);
    // Should have a call-to-action button
    await expect(page.locator('a[href="/register"], a[href="/login"]').first()).toBeVisible();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('body')).toContainText(/csomag|előfizetés|Ft/i);
  });

  test('blog page loads with articles', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('body')).toContainText(/blog|cikk/i);
    // Should have blog article links
    const articles = page.locator('a[href*="/blog/"]');
    await expect(articles.first()).toBeVisible();
  });

  test('blog article page loads', async ({ page }) => {
    await page.goto('/blog/elektronikus-alairas-magyarorszagon-2026');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(/aláírás|elektronikus/i);
  });

  test('ÁSZF page loads', async ({ page }) => {
    await page.goto('/aszf');
    await expect(page.locator('body')).toContainText(/általános|feltétel/i);
  });

  test('privacy policy page loads', async ({ page }) => {
    await page.goto('/adatvedelem');
    await expect(page.locator('body')).toContainText(/adatvédel|GDPR/i);
  });

  test('impresszum page loads', async ({ page }) => {
    await page.goto('/impresszum');
    await expect(page.locator('body')).toContainText(/Legitas|kapcsolat/i);
  });

  test('status page loads', async ({ page }) => {
    await page.goto('/status');
    await expect(page.locator('body')).toContainText(/Rendszer állapot|Minden rendszer|szolgáltatás/i);
  });

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.services.database).toBe('ok');
  });

  test('robots.txt is accessible', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();
  });

  test('sitemap.xml is accessible', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text).toContain('legitas.hu');
  });
});
