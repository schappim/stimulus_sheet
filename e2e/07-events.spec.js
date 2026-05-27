import { test, expect } from '@playwright/test';

test.describe('07 — events log', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/07-events-log.html');
    await page.waitForFunction(() => !!window.StimulusSheet?.getSheet('logSheet'));
  });

  test('emits sheet:opened, sheet:snap, sheet:closed in order', async ({ page }) => {
    const events = [];
    await page.exposeFunction('record', (name, detail) => events.push({ name, detail }));
    await page.evaluate(() => {
      for (const name of ['sheet:opened', 'sheet:snap', 'sheet:closed']) {
        document.addEventListener(name, (ev) => window.record(name, { id: ev.detail.id, state: ev.detail.state }));
      }
    });

    await page.getByRole('button', { name: 'Open', exact: true }).click();
    await page.getByRole('button', { name: 'Snap full' }).click();
    await page.getByRole('button', { name: 'Close' }).click();

    await expect.poll(() => events.map((e) => e.name)).toEqual([
      'sheet:opened',
      'sheet:snap',
      'sheet:closed',
    ]);
    expect(events[0].detail.id).toBe('logSheet');
    expect(events[0].detail.state).toBe('half');
    expect(events[1].detail.state).toBe('full');
  });
});
