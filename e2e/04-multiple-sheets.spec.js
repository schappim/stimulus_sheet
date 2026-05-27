import { test, expect } from '@playwright/test';

test.describe('04 — multiple sheets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/04-multiple-sheets.html');
    await page.waitForFunction(() => !!window.StimulusSheet?.getSheet('filterSheet')
                                  && !!window.StimulusSheet?.getSheet('sortSheet'));
  });

  test('each sheet opens independently by id', async ({ page }) => {
    await page.getByRole('button', { name: 'Filter' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('filterSheet')?._state)).toBe('half');
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('sortSheet')?._state)).toBe('closed');

    await page.evaluate(() => StimulusSheet.close('filterSheet'));
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('filterSheet')?._state)).toBe('closed');

    await page.getByRole('button', { name: 'Sort' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('sortSheet')?._state)).toBe('half');
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('filterSheet')?._state)).toBe('closed');
  });

  test('body marker stays set while either sheet is open', async ({ page }) => {
    await page.getByRole('button', { name: 'Filter' }).click();
    await expect(page.locator('body')).toHaveClass(/ss-sheet-open/);

    // Open Sort while Filter is still open (this triggers Sort's open;
    // Filter remains open in its own slot).
    await page.evaluate(() => StimulusSheet.open('sortSheet'));
    await expect(page.locator('body')).toHaveClass(/ss-sheet-open/);

    // Close one — marker still set.
    await page.evaluate(() => StimulusSheet.close('filterSheet'));
    await expect(page.locator('body')).toHaveClass(/ss-sheet-open/);

    // Close the last — marker cleared.
    await page.evaluate(() => StimulusSheet.close('sortSheet'));
    await expect(page.locator('body')).not.toHaveClass(/ss-sheet-open/);
  });
});
