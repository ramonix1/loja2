import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const uiSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../packages/ui/src');

/**
 * Dev: proxy same-origin para a API — evita CORS no browser (fetch + Socket.io).
 * Prod (build estático): browser usa VITE_API_URL + CORS na API.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../..', '');
  const apiTarget = (env.API_URL ?? env.VITE_API_PROXY_TARGET ?? 'http://localhost:3001').replace(
    /\/$/,
    '',
  );

  return {
    envDir: '../..',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': uiSrc,
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/images': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };
});
