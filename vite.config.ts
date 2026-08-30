import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';

const previewAssetCaching: Plugin = {
  name: 'preview-production-contract',
  configurePreviewServer(server) {
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (url.pathname.startsWith('/assets/')) response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      if (url.pathname === '/demo' || url.pathname === '/demo/') {
        request.url = `/index.html${url.search}`;
      } else {
        const documentPaths = new Set(['/', '/index.html', '/privacy', '/privacy/', '/terms', '/terms/', '/404.html']);
        const acceptsHtml = request.headers.accept?.includes('text/html');
        const isExtensionless = !url.pathname.split('/').at(-1)?.includes('.');
        const isUnknownDocument = !documentPaths.has(url.pathname)
          && !url.pathname.startsWith('/api/')
          && (acceptsHtml || isExtensionless);
        if (isUnknownDocument) {
          response.statusCode = 404;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(readFileSync(new URL('./dist/404.html', import.meta.url)));
          return;
        }
      }
      next();
    });
  }
};

export default defineConfig({
  build: { target: 'es2022', sourcemap: true },
  plugins: [previewAssetCaching],
  test: { include: ['src/**/*.test.ts'] }
});
