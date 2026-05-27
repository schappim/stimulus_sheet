import { test, expect } from '@playwright/test';

/* Pointer-based drag verification. The whole reason this library
 * uses Pointer Events is single-codepath drag on iOS WebKit, so
 * exercise the drag in WebKit specifically and assert the snap. */

test.describe('drag handle gestures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/02-half-and-full.html');
    await page.waitForFunction(() => !!window.StimulusSheet?.getSheet('hfSheet'));
    // Open in half so we can flick down to close, or up to expand.
    await page.evaluate(() => StimulusSheet.open('hfSheet'));
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('hfSheet')?._state)).toBe('half');
  });

  test('flick down on the handle closes the sheet', async ({ page }) => {
    const handle = page.locator('[data-sheet-id-value="hfSheet"] .ss-sheet-handle');
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();

    // Pointer-event drag: down, move >>threshold quickly, then up.
    // High velocity guarantees the "fast flick down" branch closes.
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // Two intermediate moves so the velocity calc has a sample with
    // distance > threshold but a small elapsed time.
    await page.mouse.move(startX, startY + 40, { steps: 2 });
    await page.mouse.move(startX, startY + 400, { steps: 2 });
    await page.mouse.up();

    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('hfSheet')?._state)).toBe('closed');
  });

  test('flick up on the handle expands to full', async ({ page }) => {
    const handle = page.locator('[data-sheet-id-value="hfSheet"] .ss-sheet-handle');
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY - 40, { steps: 2 });
    await page.mouse.move(startX, startY - 300, { steps: 2 });
    await page.mouse.up();

    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('hfSheet')?._state)).toBe('full');
  });

  test('a plain tap on the handle (no drag) leaves state unchanged', async ({ page }) => {
    const handle = page.locator('[data-sheet-id-value="hfSheet"] .ss-sheet-handle');
    await handle.click();
    // Below the 6px threshold the controller treats it as a tap, so
    // state stays half.
    expect(await page.evaluate(() => StimulusSheet.getSheet('hfSheet')?._state)).toBe('half');
  });
});
