import { test, expect } from '@playwright/test';

/* The basic demo opens a sheet half-snapped, dismisses on backdrop
 * tap, and on "Dismiss" row tap. */

test.describe('01 — basic sheet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/01-basic.html');
    // Wait for the controller to register the sheet (it does so on
    // connect, which is sync after Stimulus's first observe pass).
    await page.waitForFunction(() => !!window.StimulusSheet?.getSheet('basicSheet'));
  });

  test('starts closed and the body marker is clean', async ({ page }) => {
    const isOpen = await page.evaluate(() => StimulusSheet.isOpen('basicSheet'));
    expect(isOpen).toBe(false);
    await expect(page.locator('body')).not.toHaveClass(/ss-sheet-open/);
  });

  test('trigger click opens to half by default', async ({ page }) => {
    await page.getByRole('button', { name: 'Open sheet' }).click();
    // The controller sets state synchronously; readback via the API.
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('basicSheet')?._state)).toBe('half');
    await expect(page.locator('body')).toHaveClass(/ss-sheet-open/);
    await expect(page.locator('[data-sheet-id-value="basicSheet"] .ss-sheet')).toHaveClass(/ss-sheet-half/);
  });

  test('snap-to-full row promotes the sheet to full', async ({ page }) => {
    await page.getByRole('button', { name: 'Open sheet' }).click();
    await page.getByRole('button', { name: 'Snap to full' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('basicSheet')?._state)).toBe('full');
    await expect(page.locator('[data-sheet-id-value="basicSheet"] .ss-sheet')).toHaveClass(/ss-sheet-full/);
  });

  test('backdrop click dismisses', async ({ page }) => {
    await page.getByRole('button', { name: 'Open sheet' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('basicSheet')?._state)).toBe('half');

    await page.locator('[data-sheet-id-value="basicSheet"] .ss-sheet-backdrop').click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('basicSheet')?._state)).toBe('closed');
    await expect(page.locator('body')).not.toHaveClass(/ss-sheet-open/);
  });

  test('Dismiss row closes the sheet and clears the body marker', async ({ page }) => {
    await page.getByRole('button', { name: 'Open sheet' }).click();
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('basicSheet')?._state)).toBe('closed');
    await expect(page.locator('body')).not.toHaveClass(/ss-sheet-open/);
  });
});
