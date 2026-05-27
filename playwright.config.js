import { defineConfig, devices } from '@playwright/test';

/* Playwright e2e config.
 *
 * Spins up the Vite demo server on port 5173 and runs the test suite
 * against the live demo pages.
 *
 * Why two projects:
 *   - chromium: fast headless feedback, runs in CI.
 *   - webkit:   the closest analogue to iOS Safari + the WKWebView that
 *               TurboNative uses on iOS. The whole point of this
 *               library is to behave well under WKWebView, so we hold
 *               webkit to the same bar as chromium.
 *
 * Mobile-shaped viewport on both projects — these demos are sized for
 * a phone (390×844) so the bottom-sheet geometry is realistic.
 */
export default defineConfig({
  testDir: './e2e',
  // fullyParallel is OFF — tests within one spec file share a worker
  // and run serially. macOS's system WebKit starves under too many
  // concurrent processes (the dev server's first-load compile races
  // multi-worker page boots and the page can't import
  // dist/stimulus_sheet.js in time). Across files we still parallelise
  // via `workers`.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // 2 workers is enough to see real parallelism without overwhelming
  // local WebKit. CI Linux runners are happy with 1.
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:5179',
    trace: 'on-first-retry',
    viewport: { width: 390, height: 844 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5179/demo/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
