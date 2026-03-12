import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.services.database).toBe('ok');
    expect(body.uptime).toBeGreaterThan(0);
  });

  test('unauthenticated requests return 401', async ({ request }) => {
    const endpoints = [
      '/api/contracts',
      '/api/credits/balance',
      '/api/templates',
      '/api/auth/profile',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(401);
    }
  });

  test('credit packs endpoint requires auth', async ({ request }) => {
    const response = await request.get('/api/credits/packs');
    expect(response.status()).toBe(401);
  });

  test('admin endpoints require auth', async ({ request }) => {
    const response = await request.get('/api/admin/stats');
    expect(response.status()).toBe(401);
  });

  test('feature flags endpoint works', async ({ request }) => {
    const response = await request.get('/api/feature-flags');
    // May return 200 (public) or 401 (auth required)
    expect([200, 401]).toContain(response.status());
  });
});
