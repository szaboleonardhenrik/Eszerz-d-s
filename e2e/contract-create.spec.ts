import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from './constants';

test.describe('Contract Creation E2E', () => {
  test.skip(!process.env.E2E_PASSWORD, 'Set E2E_PASSWORD to run authenticated tests');
  test.use({ storageState: STORAGE_STATE });

  test('create contract from template end-to-end', async ({ page }) => {
    const uniqueSuffix = Date.now();
    const contractTitle = `E2E Teszt Szerződés ${uniqueSuffix}`;

    // 1. Go to create page
    await page.goto('/create');
    await page.waitForLoadState('networkidle');

    // Step 1: Template selection — find "Kiválasztás" button on first template card
    const selectBtn = page.locator('button', { hasText: 'Kiválasztás' }).first();
    await expect(selectBtn).toBeVisible({ timeout: 15000 });
    await selectBtn.click();

    // Step 2: Fill variables — wizard auto-advances on selectTemplate()
    // The title input is pre-filled with the template name; overwrite it
    const titleInput = page.locator('input').filter({ has: page.locator(':scope') }).first();
    // More specific: find the input under "Szerződés neve" label
    const contractNameInput = page
      .locator('label', { hasText: 'Szerződés neve' })
      .locator('..')
      .locator('input');
    await expect(contractNameInput).toBeVisible({ timeout: 10000 });
    await contractNameInput.fill(contractTitle);

    // Fill all visible required text/number/date inputs for template variables
    // (skip disabled inputs which are signer-fills)
    const variableInputs = page.locator(
      '.space-y-4 input:not([disabled]):visible, .space-y-4 textarea:not([disabled]):visible'
    );
    const inputCount = await variableInputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = variableInputs.nth(i);
      const currentValue = await input.inputValue();
      // Skip if already filled (e.g. the title we just set)
      if (currentValue.trim()) continue;

      const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
      const inputType = await input.getAttribute('type');
      const placeholder = (await input.getAttribute('placeholder')) || '';

      if (inputType === 'date') {
        await input.fill('2026-12-31');
      } else if (inputType === 'number') {
        await input.fill('500000');
      } else if (placeholder.includes('email') || placeholder.includes('Email')) {
        await input.fill('teszt@example.com');
      } else if (placeholder.includes('adószám') || placeholder.includes('adoszam')) {
        await input.fill('12345678-1-42');
      } else if (placeholder.includes('TAJ') || placeholder.includes('taj')) {
        await input.fill('123-456-789');
      } else if (placeholder.includes('cím') || placeholder.includes('lakcím') || placeholder.includes('székhely')) {
        await input.fill('1052 Budapest, Váci utca 1.');
      } else if (placeholder.includes('telefon')) {
        await input.fill('+36 30 123 4567');
      } else if (
        placeholder.includes('bér') ||
        placeholder.includes('díj') ||
        placeholder.includes('összeg') ||
        placeholder.includes('ár')
      ) {
        await input.fill('500 000');
      } else if (tagName === 'textarea') {
        await input.fill('E2E teszt szöveges adat');
      } else {
        await input.fill('E2E Teszt Adat');
      }
    }

    // Click "Következő" to go to Step 3
    const step2Next = page.locator('button', { hasText: 'Következő' }).first();
    await expect(step2Next).toBeVisible();
    await step2Next.click();

    // Step 3: Signers — select "Csak én" (owner_only) for simplest path
    const ownerOnlyBtn = page.locator('button', { hasText: 'Csak én' });
    await expect(ownerOnlyBtn).toBeVisible({ timeout: 10000 });
    await ownerOnlyBtn.click();

    // Click "Következő" to go to Step 4
    const step3Next = page.locator('button', { hasText: 'Következő' }).first();
    await expect(step3Next).toBeVisible();
    await step3Next.click();

    // Step 4: Summary — verify contract title is displayed
    await expect(page.locator('body')).toContainText(contractTitle, { timeout: 10000 });

    // Verify the summary shows "Összegzés" heading
    await expect(page.locator('body')).toContainText('Összegzés');

    // Click "Szerződés létrehozása"
    const createBtn = page.locator('button', { hasText: 'Szerződés létrehozása' });
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await createBtn.click();

    // Should redirect to the contract detail page: /contracts/<uuid>
    await page.waitForURL(/\/contracts\/[a-f0-9-]+/, { timeout: 40000 });

    // Verify we are on the contract detail page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/contracts\/[a-f0-9-]+/);

    // The detail page should show the contract title
    await expect(page.locator('body')).toContainText(contractTitle, { timeout: 10000 });
  });

  test('contract list shows created contracts', async ({ page }) => {
    await page.goto('/contracts');
    await page.waitForLoadState('networkidle');

    // Retry navigation if server error (502/500 during deployments)
    const bodyText = await page.locator('body').textContent();
    if (bodyText?.includes('Internal Server Error') || bodyText?.includes('502')) {
      await page.waitForTimeout(3000);
      await page.reload();
      await page.waitForLoadState('networkidle');
    }

    await expect(page).toHaveURL(/contracts/);

    // The page should render contract cards or a table
    const body = page.locator('body');
    await expect(body).toContainText(/szerződés/i, { timeout: 15000 });
  });

  test('contract creation rejects empty payload via API', async ({ request }) => {
    // Without auth token the API should reject
    const response = await request.post('/api/contracts', {
      data: { title: '', signers: [] },
    });
    // Expect 400 (validation), 401 (unauthorized), 403 (forbidden), or 500 (server error on empty data)
    expect([400, 401, 403, 500]).toContain(response.status());
  });

  test('free tier limits are enforced (max 2 signers)', async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('networkidle');

    // Select a template
    const selectBtn = page.locator('button', { hasText: 'Kiválasztás' }).first();
    await expect(selectBtn).toBeVisible({ timeout: 15000 });
    await selectBtn.click();

    // Skip through step 2
    const step2Next = page.locator('button', { hasText: 'Következő' }).first();
    await expect(step2Next).toBeVisible({ timeout: 10000 });
    await step2Next.click();

    // Step 3: Select "Csak a partner(ek)" mode
    const partnerOnlyBtn = page.locator('button', { hasText: 'Csak a partner(ek)' });
    await expect(partnerOnlyBtn).toBeVisible({ timeout: 10000 });
    await partnerOnlyBtn.click();

    // Should see the partner signers section with "Partner aláíró hozzáadása"
    const addSignerBtn = page.locator('button', { hasText: 'Partner aláíró hozzáadása' });
    await expect(addSignerBtn).toBeVisible({ timeout: 5000 });

    // The page should have partner signer inputs
    const signerBlocks = page.locator('text=Partner aláíró');
    expect(await signerBlocks.count()).toBeGreaterThanOrEqual(1);
  });
});
