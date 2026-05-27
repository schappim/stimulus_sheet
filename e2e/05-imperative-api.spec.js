import { test, expect } from '@playwright/test';

test.describe('05 — imperative API', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/05-imperative-api.html');
    await page.waitForFunction(() => !!window.StimulusSheet?.getSheet('imperativeSheet'));
  });

  test('StimulusSheet.open/close/toggle drives the sheet', async ({ page }) => {
    await page.evaluate(() => StimulusSheet.open('imperativeSheet'));
    await expect.poll(() => page.evaluate(() => StimulusSheet.isOpen('imperativeSheet'))).toBe(true);

    await page.evaluate(() => StimulusSheet.close('imperativeSheet'));
    await expect.poll(() => page.evaluate(() => StimulusSheet.isOpen('imperativeSheet'))).toBe(false);

    await page.evaluate(() => StimulusSheet.toggle('imperativeSheet', { expanded: true }));
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('imperativeSheet')?._state)).toBe('full');

    await page.evaluate(() => StimulusSheet.toggle('imperativeSheet'));
    await expect.poll(() => page.evaluate(() => StimulusSheet.isOpen('imperativeSheet'))).toBe(false);
  });
});
