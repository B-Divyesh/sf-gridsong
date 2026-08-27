import { defineConfig, type Plugin } from 'vite';

const previewAssetCaching: Plugin = {
  name: 'preview-asset-caching',
  configurePreviewServer(server) {
    server.middlewares.use((request, response, next) => {
      if (request.url?.startsWith('/assets/')) response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      next();
    });
  }
};

export default defineConfig({
  build: { target: 'es2022', sourcemap: true },
  plugins: [previewAssetCaching],
  test: { include: ['src/**/*.test.ts'] }
});
