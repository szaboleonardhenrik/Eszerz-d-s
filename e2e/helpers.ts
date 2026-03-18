import { Locator, Page } from '@playwright/test';

/**
 * Select element by data-testid with fallback to CSS/text selector.
 * This allows tests to work both before and after data-testid deployment.
 */
export function tid(page: Page, testId: string, fallback?: string): Locator {
  if (fallback) {
    return page.locator(`[data-testid="${testId}"], ${fallback}`).first();
  }
  return page.locator(`[data-testid="${testId}"]`);
}
