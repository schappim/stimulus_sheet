import { test, expect } from '@playwright/test';

test.describe('10 — Hotwire-Native bridge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/10-hotwire-native-bridge.html');
    await page.waitForFunction(() => !!window.StimulusSheet?.getSheet('bridgeWebFallback'));
  });

  test('on a plain browser the bridge falls back to opening the web sheet', async ({ page }) => {
    // No native shell present → web sheet opens.
    await page.getByRole('button', { name: 'More…' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.isOpen('bridgeWebFallback'))).toBe(true);
    // Log should be empty — the bridge event only fires when native.
    await expect(page.locator('#log')).toHaveText('');
  });

  test('when the document is marked Hotwire-Native, the bridge event fires instead', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dataset.hotwireNative = 'true';
    });
    await page.getByRole('button', { name: 'More…' }).click();

    // The web sheet must NOT open (the bridge takes over).
    expect(await page.evaluate(() => StimulusSheet.isOpen('bridgeWebFallback'))).toBe(false);
    // The log captures the dispatched event.
    await expect(page.locator('#log')).toContainText('"component": "sheet"');
    await expect(page.locator('#log')).toContainText('"id": "bridgeWebFallback"');
    await expect(page.locator('#log')).toContainText('"title": "Edit"');
  });
});
