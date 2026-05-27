import { defineConfig } from 'vite';
import { resolve } from 'path';

/* Library build — produces two flavours:
 *
 *   dist/stimulus_sheet.js       IIFE, includes @hotwired/stimulus inline.
 *                                Drop into a static <script> tag and call
 *                                window.StimulusSheet.start(). Use for plain
 *                                HTML / file:// / non-bundler consumers.
 *
 *   dist/stimulus_sheet.esm.js   ESM module, externalises @hotwired/stimulus.
 *                                Use with importmaps (Rails) or any ES-module
 *                                consumer that pins stimulus separately.
 *
 *   dist/stimulus_sheet.css      Shared default theme, identical content.
 *
 * Switch between formats by passing FORMAT=iife or FORMAT=es. `npm run
 * build:lib` builds both in sequence then runs bin/sync-rails-assets to
 * vendor the artefacts into the gem.
 */
const FORMAT = process.env.FORMAT || 'iife';
const isES = FORMAT === 'es';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'StimulusSheet',
      fileName: () => (isES ? 'stimulus_sheet.esm.js' : 'stimulus_sheet.js'),
      formats: [FORMAT],
    },
    rollupOptions: {
      external: isES ? ['@hotwired/stimulus'] : [],
      output: {
        assetFileNames: (info) =>
          info.name.endsWith('.css') ? 'stimulus_sheet.css' : info.name,
        globals: {},
        extend: true,
        // The IIFE deliberately exposes both default + named exports so
        // window.StimulusSheet behaves like a namespace AND its
        // controllers can be named-imported in a bundler context.
        exports: 'named',
      },
    },
    sourcemap: true,
    target: 'es2020',
  },
});
