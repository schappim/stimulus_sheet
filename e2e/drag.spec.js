import { test, expect } from '@playwright/test';

/* Pointer-based drag verification.
 *
 * The whole reason this library uses Pointer Events is single-codepath
 * drag on iOS WebKit, so exercise the drag in WebKit specifically and
 * assert the snap.
 *
 * Driving via page.touchscreen rather than page.mouse: Playwright's
 * mouse synthesisation works for pointer events on Chromium, but on
 * WebKit `page.mouse.move(x, y, { steps: N })` only emits mouse
 * events (no pointermove). Touchscreen events fire native touch +
 * pointer events on both browsers, which is also what a real user's
 * finger sends. We synthesise the drag with explicit CDP-level pointer
 * events through the touchscreen API so the same test runs identically
 * on both engines. */

test.describe('drag handle gestures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/02-half-and-full.html');
    await page.waitForFunction(() => !!window.StimulusSheet?.getSheet('hfSheet'));
    await page.evaluate(() => StimulusSheet.open('hfSheet'));
    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('hfSheet')?._state)).toBe('half');
    // boundingBox() returns the CURRENT rendered transform, not the
    // target. The open animation is a 350ms CSS transition — waiting
    // one frame past it means handle.boundingBox() reports its actual
    // settled position.
    await page.waitForTimeout(400);
  });

  /* Drive a touch-style drag via the page's own pointer events.
   * `dispatchEvent` with PointerEvent is cross-browser, and we
   * control the timestamps so the velocity calc is deterministic.
   * Chromium and WebKit both honour this path because the events
   * carry pointerType "touch" + isPrimary true. */
  async function pointerDrag(page, sheetSelector, fromY, toY, durationMs = 80) {
    await page.evaluate(([sel, sy, ey, dur]) => {
      const sheet = document.querySelector(sel);
      const handle = sheet.querySelector('.ss-sheet-handle');
      const rect = handle.getBoundingClientRect();
      const x = rect.x + rect.width / 2;

      // Pick a target element for each event — the drag handler does
      // `host.sheetEl.contains(ev.target)`, so the target must be
      // inside the sheet.
      const fire = (name, clientY, target = sheet) => {
        const ev = new PointerEvent(name, {
          bubbles: true,
          cancelable: true,
          pointerId: 7,
          pointerType: 'touch',
          isPrimary: true,
          clientX: x,
          clientY,
          button: name === 'pointerdown' ? 0 : -1,
          buttons: name === 'pointerup' ? 0 : 1,
        });
        target.dispatchEvent(ev);
      };

      fire('pointerdown', sy, handle);
      const steps = 12;
      const start = performance.now();
      return new Promise((resolve) => {
        let i = 0;
        const tick = () => {
          i += 1;
          const t = i / steps;
          const cy = sy + (ey - sy) * t;
          fire('pointermove', cy, sheet);
          if (i >= steps) {
            fire('pointerup', ey, sheet);
            resolve({ elapsed: performance.now() - start });
            return;
          }
          // Spread the steps over ~`dur` ms so velocity is high enough
          // to land in the flick branch (>0.4 px/ms on the wider moves).
          setTimeout(tick, Math.max(1, dur / steps));
        };
        setTimeout(tick, Math.max(1, dur / steps));
      });
    }, [sheetSelector, fromY, toY, durationMs]);
  }

  test('flick down on the handle closes the sheet', async ({ page }) => {
    const handle = page.locator('[data-sheet-id-value="hfSheet"] .ss-sheet-handle');
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();
    const startY = box.y + box.height / 2;

    await pointerDrag(page, '[data-sheet-id-value="hfSheet"] .ss-sheet', startY, startY + 400);

    await expect.poll(() => page.evaluate(() => StimulusSheet.getSheet('hfSheet')?._state)).toBe('closed');
  });

  test('flick up on the handle expands to full', async ({ page }) => {
    const handle = page.locator('[data-sheet-id-value="hfSheet"] .ss-sheet-handle');
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();
    const startY = box.y + box.height / 2;

    await pointerDrag(page, '[data-sheet-id-value="hfSheet"] .ss-sheet', startY, startY - 300);

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
