#!/usr/bin/env node
/* Generate README screenshots from the live demo pages.
 *
 * Requires: the vite dev server to be running (`npm run dev`) and
 * Playwright's webkit/chromium installed. Writes PNGs into
 * docs/screenshots/.
 *
 * We use WebKit so the screenshots match what an iOS / Hotwire-Native
 * shell renders (font kerning, rounded scrollbars, safe-area cues). */

import { chromium, webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = resolve(__dirname, '..', 'docs', 'screenshots');
const BASE_URL  = process.env.BASE_URL || 'http://localhost:5179';

// Phone-shaped viewport so the screenshots feel like an iPhone.
const VIEWPORT = { width: 390, height: 760 };

/**
 * Each shot describes one PNG to capture.
 *   - file: output filename inside docs/screenshots/
 *   - url:  demo URL (relative to BASE_URL)
 *   - prep: function(page) -> Promise<void>, run after page is ready
 *   - wait: optional ms to wait after `prep` before snapping
 */
const SHOTS = [
  {
    file: '01-basic-closed.png',
    url:  '/demo/01-basic.html',
    prep: async () => {},
    wait: 100,
  },
  {
    file: '01-basic-open.png',
    url:  '/demo/01-basic.html',
    prep: (page) => page.evaluate(() => StimulusSheet.open('basicSheet')),
    wait: 500,
  },
  {
    file: '02-half-snap.png',
    url:  '/demo/02-half-and-full.html',
    prep: (page) => page.evaluate(() => StimulusSheet.open('hfSheet')),
    wait: 500,
  },
  {
    file: '02-full-snap.png',
    url:  '/demo/02-half-and-full.html',
    prep: (page) => page.evaluate(() => StimulusSheet.open('hfSheet', { expanded: true })),
    wait: 500,
  },
  {
    file: '03-action-list.png',
    url:  '/demo/03-action-list.html',
    prep: (page) => page.evaluate(() => StimulusSheet.open('actionSheet', { expanded: true })),
    wait: 500,
  },
  {
    file: '04-multiple-sheets.png',
    url:  '/demo/04-multiple-sheets.html',
    prep: (page) => page.evaluate(() => StimulusSheet.open('filterSheet')),
    wait: 500,
  },
  {
    file: '06-portal.png',
    url:  '/demo/06-portaled-from-frame.html',
    prep: (page) => page.evaluate(() => StimulusSheet.open('portalSheet')),
    wait: 500,
  },
  {
    file: '08-non-dismissable.png',
    url:  '/demo/08-non-dismissable.html',
    prep: (page) => page.evaluate(() => StimulusSheet.open('ndSheet', { expanded: true })),
    wait: 500,
  },
  {
    file: '09-form-in-sheet.png',
    url:  '/demo/09-form-in-sheet.html',
    prep: async (page) => {
      await page.evaluate(() => StimulusSheet.open('formSheet', { expanded: true }));
      await page.waitForTimeout(400);
      await page.fill('input[name="title"]', 'Buy milk');
      await page.fill('textarea[name="body"]', 'Two litres, full cream');
    },
    wait: 200,
  },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // WebKit so the screenshots look like the iOS / Hotwire-Native shell
  // this library targets.
  const browser = await webkit.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,        // retina-quality PNGs for README
    hasTouch: true,
    isMobile: true,
  });

  for (const shot of SHOTS) {
    const page = await context.newPage();
    const url  = BASE_URL + shot.url;
    process.stdout.write(`→ ${shot.file.padEnd(28)} ${url} ... `);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof window.StimulusSheet === 'object', {}, { timeout: 5000 });
      await shot.prep(page);
      if (shot.wait) await page.waitForTimeout(shot.wait);
      await page.screenshot({
        path: resolve(OUT_DIR, shot.file),
        fullPage: false,
      });
      process.stdout.write('ok\n');
    } catch (err) {
      process.stdout.write(`FAILED: ${err.message}\n`);
      process.exitCode = 1;
    } finally {
      await page.close();
    }
  }

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
