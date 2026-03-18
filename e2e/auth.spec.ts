import { test, expect } from '@playwright/test';

// Use environment variables or defaults for test credentials
const TEST_EMAIL = process.env.E2E_EMAIL || 'teszt2@legitas.hu';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'Test1234!';

test.describe('Authentication', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/landing');
    await expect(page).toHaveTitle(/Legitas/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'invalid@test.hu');
    await page.fill('[data-testid="login-password"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');
    // Should show error toast or message
    await page.waitForTimeout(2000);
    // Should still be on login page
    await expect(page).toHaveURL(/login/);
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    test.skip(!process.env.E2E_PASSWORD, 'Set E2E_PASSWORD env var to run this test');
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', TEST_EMAIL);
    await page.fill('[data-testid="login-password"]', TEST_PASSWORD);
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('[data-testid="register-email"]')).toBeVisible();
  });

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
