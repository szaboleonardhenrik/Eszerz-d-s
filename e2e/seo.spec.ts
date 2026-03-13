import { test, expect } from '@playwright/test';

test.describe('SEO & Accessibility', () => {
  test('landing page has proper meta tags', async ({ page }) => {
    await page.goto('/landing');

    // Title
    await expect(page).toHaveTitle(/Legitas/);

    // Meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(50);

    // OG tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeTruthy();
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    expect(ogType).toBe('website');

    // Twitter card
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twitterCard).toBe('summary_large_image');

    // Canonical
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('legitas.hu');
  });

  test('blog article has OG article tags', async ({ page }) => {
    await page.goto('/blog/elektronikus-alairas-magyarorszagon-2026');

    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    expect(ogType).toBe('article');

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeTruthy();
  });

  test('pricing page has structured pricing info', async ({ page }) => {
    await page.goto('/pricing');

    // Should show plan names
    await expect(page.locator('body')).toContainText(/Kezdő|Starter/i);
    await expect(page.locator('body')).toContainText(/Prémium|Premium/i);

    // Should show prices in HUF
    await expect(page.locator('body')).toContainText(/Ft/);

    // Should show yearly discount
    await expect(page.locator('body')).toContainText(/23%/);
  });

  test('JSON-LD structured data is valid', async ({ page }) => {
    await page.goto('/landing');

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toBeTruthy();

    const parsed = JSON.parse(jsonLd!);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed.name).toBe('Legitas');
    expect(parsed.offers.priceCurrency).toBe('HUF');
  });

  test('hreflang tags are present on key pages', async ({ page }) => {
    const pages = ['/landing', '/pricing', '/blog'];

    for (const path of pages) {
      await page.goto(path);
      const hreflangHu = await page.locator('link[rel="alternate"][hreflang="hu"]').getAttribute('href');
      expect(hreflangHu, `${path} should have hu hreflang`).toBeTruthy();

      const hreflangDefault = await page.locator('link[rel="alternate"][hreflang="x-default"]').getAttribute('href');
      expect(hreflangDefault, `${path} should have x-default hreflang`).toBeTruthy();
    }
  });

  test('all pages have lang="hu" attribute', async ({ page }) => {
    await page.goto('/landing');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('hu');
  });

  test('images have alt attributes', async ({ page }) => {
    await page.goto('/landing');
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `Image #${i} should have alt attribute`).not.toBeNull();
    }
  });

  test('headings are in correct order', async ({ page }) => {
    await page.goto('/landing');

    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // h1 should come before h2
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('sitemap contains dynamic blog entries', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    const text = await response.text();

    expect(text).toContain('/blog/');
    expect(text).toContain('legitas.hu');
    // Should have multiple blog URLs
    const blogMatches = text.match(/\/blog\//g);
    expect(blogMatches!.length).toBeGreaterThan(3);
  });

  test('robots.txt allows indexing', async ({ request }) => {
    const response = await request.get('/robots.txt');
    const text = await response.text();

    expect(text.toLowerCase()).toContain('user-agent');
    expect(text).toContain('Sitemap');
    // Should not disallow everything
    expect(text).not.toContain('Disallow: /\n');
  });

  test('viewport meta is properly configured', async ({ page }) => {
    await page.goto('/landing');
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
    // Should NOT restrict user scaling (WCAG)
    expect(viewport).not.toContain('user-scalable=no');
    expect(viewport).not.toContain('maximum-scale=1');
  });
});
