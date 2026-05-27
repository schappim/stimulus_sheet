import { test, expect } from '@playwright/test';

test.describe('09 — form in a sheet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/09-form-in-sheet.html');
    await page.waitForFunction(() => !!window.StimulusSheet?.getSheet('formSheet'));
  });

  test('form submit closes the sheet', async ({ page }) => {
    await page.getByRole('button', { name: 'New note' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.isOpen('formSheet'))).toBe(true);

    await page.fill('input[name="title"]', 'Buy milk');
    await page.fill('textarea[name="body"]', 'Two litres, full cream');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => page.evaluate(() => StimulusSheet.isOpen('formSheet'))).toBe(false);
    // The log shows the captured form data.
    await expect(page.locator('#log')).toContainText('Buy milk');
  });

  test('Cancel closes without submitting', async ({ page }) => {
    await page.getByRole('button', { name: 'New note' }).click();
    await page.fill('input[name="title"]', 'irrelevant');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.isOpen('formSheet'))).toBe(false);
    await expect(page.locator('#log')).toHaveText('');
  });
});
