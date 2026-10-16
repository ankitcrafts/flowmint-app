import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/auth': {
            target: 'http://localhost:3000',
            changeOrigin: true,
            secure: false
          },
          '/api': {
              target: 'http://localhost:3000',
              changeOrigin: true,
              secure: false
          }
        }
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'FlowMint',
            short_name: 'FlowMint',
            description: 'Your AI Financial Copilot for expense tracking and financial planning.',
            theme_color: '#0A0A0A',
            background_color: '#0A0A0A',
            display: 'standalone',
            start_url: '/',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
