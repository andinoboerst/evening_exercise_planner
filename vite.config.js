import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function devApiPlugin() {
  return {
    name: 'dev-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url, 'http://localhost');
          if (url.pathname.startsWith('/api/planner/ics')) {
            const token = url.searchParams.get('token') || url.pathname.split('/ics/')[1]?.split('/')[0];
            const { default: handler } = await import('./api/planner/ics.js');
            req.query = Object.fromEntries(url.searchParams.entries());
            req.query.token = token;
            return handler(req, res);
          }
          if (url.pathname.startsWith('/api/planner/alarm')) {
            const { default: handler } = await import('./api/planner/alarm.js');
            req.query = Object.fromEntries(url.searchParams.entries());
            return handler(req, res);
          }
        } catch (e) {
          console.error('devApiPlugin error:', e);
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    plugins: [
      devApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'AndiNú',
        short_name: 'AndiNú',
        description: 'Shared Private Space',
        theme_color: '#090d16',
        background_color: '#090d16',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
};
});
