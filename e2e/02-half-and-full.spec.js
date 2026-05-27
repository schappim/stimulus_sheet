import { test, expect } from '@playwright/test';

test.describe('02 — half & full triggers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/02-half-and-full.html');
    await page.waitForFunction(() => !!window.StimulusSheet?.getSheet('hfSheet'));
  });

  test('"Open (half)" lands in half mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Open (half)' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('hfSheet')?._state)).toBe('half');
  });

  test('"Open (full)" lands in full mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Open (full)' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('hfSheet')?._state)).toBe('full');
  });

  test('half can be promoted to full via expand()', async ({ page }) => {
    await page.getByRole('button', { name: 'Open (half)' }).click();
    await page.evaluate(() => StimulusSheet.getSheet('hfSheet').expand());
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('hfSheet')?._state)).toBe('full');
  });

  test('full can be demoted to half via half()', async ({ page }) => {
    await page.getByRole('button', { name: 'Open (full)' }).click();
    await page.evaluate(() => StimulusSheet.getSheet('hfSheet').half());
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('hfSheet')?._state)).toBe('half');
  });
});
