import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'fs';

/* Demo server. Mirrors stimulus_kanban / stimulus_grid: vite roots at the
 * project root so `<script src="../dist/...">` from demo HTMLs resolves to
 * the dist bundle. Demos live in demo/ and are served at
 * http://localhost:5173/demo/<page>.html. */
const demoDir = resolve(__dirname, 'demo');
const demoPages = Object.fromEntries(
  readdirSync(demoDir)
    .filter((f) => f.endsWith('.html'))
    .map((f) => [`demo/${f.replace(/\.html$/, '')}`, resolve(demoDir, f)])
);

const rootRedirectPlugin = {
  name: 'root-redirect-to-demo',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/' || req.url === '') {
        res.writeHead(302, { Location: '/demo/' });
        res.end();
        return;
      }
      next();
    });
  },
};

export default defineConfig({
  root: '.',
  publicDir: false,
  plugins: [rootRedirectPlugin],
  build: {
    outDir: resolve(__dirname, 'dist-demos'),
    emptyOutDir: true,
    rollupOptions: {
      input: { index: resolve(demoDir, 'index.html'), ...demoPages },
    },
  },
  server: {
    host: true,
    port: 5173,
    open: false,
    strictPort: false,
    fs: { allow: [resolve(__dirname, '.')] },
  },
});
