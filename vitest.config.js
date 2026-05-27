import { defineConfig } from 'vitest/config';

/* Unit-test config for the JS core. Kept separate from vite.config.js (which
 * serves the demos) so the two never entangle. Vitest auto-prefers this file
 * over vite.config.js. */
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js', 'test/**/*.spec.js'],
    globals: false,
  },
});
