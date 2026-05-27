import { test, expect } from '@playwright/test';

test.describe('06 — portal-to-body', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/06-portaled-from-frame.html');
    await page.waitForFunction(() => !!window.StimulusSheet?.getSheet('portalSheet'));
  });

  test('the sheet wrapper is lifted out of the transformed ancestor', async ({ page }) => {
    const wrapInfo = await page.evaluate(() => {
      const wrap = document.querySelector('[data-sheet-id-value="portalSheet"]');
      return {
        exists: !!wrap,
        parentTag: wrap?.parentElement?.tagName,
        parentIsBody: wrap?.parentElement === document.body,
        slot: wrap?.getAttribute('data-ss-portal-slot'),
      };
    });
    expect(wrapInfo.exists).toBe(true);
    expect(wrapInfo.parentIsBody).toBe(true);
    expect(wrapInfo.parentTag).toBe('BODY');
    expect(wrapInfo.slot).toBe('portalSheet');
  });

  test('trigger inside the frame still opens the portaled sheet', async ({ page }) => {
    await page.getByRole('button', { name: 'Open from inside a frame' }).click();
    await expect.poll(() => page.evaluate(() => StimulusSheet.isOpen('portalSheet'))).toBe(true);

    // And the visual sheet is sitting in the viewport (not clipped
    // inside the transformed ancestor). With the bottom-anchored sheet
    // open in half mode, its top edge should be roughly mid-viewport.
    const box = await page.locator('[data-sheet-id-value="portalSheet"] .ss-sheet').boundingBox();
    expect(box).not.toBeNull();
    expect(box.y).toBeGreaterThan(100);
    expect(box.y).toBeLessThan(900);
  });
});
