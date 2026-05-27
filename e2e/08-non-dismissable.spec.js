import { test, expect } from '@playwright/test';

test.describe('08 — non-dismissable', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/08-non-dismissable.html');
    await page.waitForFunction(() => !!window.StimulusSheet?.getSheet('ndSheet'));
  });

  test('backdrop click does NOT close', async ({ page }) => {
    await page.getByRole('button', { name: 'Open required-confirm' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.isOpen('ndSheet'))).toBe(true);

    // The backdrop has no click→sheet#close — clicking it must not close.
    await page.locator('[data-sheet-id-value="ndSheet"] .ss-sheet-backdrop').click({ force: true });
    // Give one frame for any (incorrect) close transition to start.
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => StimulusSheet.isOpen('ndSheet'))).toBe(true);

    // An explicit Confirm row DOES close it.
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.isOpen('ndSheet'))).toBe(false);
  });
});
