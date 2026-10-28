import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5280'

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.webmanifest',
        includeAssets: ['favicon.ico', 'theme-init.js', 'icons/icon-192x192.png', 'icons/icon-512x512.png'],
        manifest: {
          name: 'GLPI Ticket Manager',
          short_name: 'GLPI Manager',
          description: 'Gestión de tickets de GLPI 11 en tiempo real',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#020617',
          theme_color: '#020617',
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/hubs\//],
          importScripts: ['/custom-sw.js'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: 5173,
      watch: {
        usePolling: true,
        ignored: ['**/playwright-report/**', '**/test-results/**', '**/.git/**'],
      },
      // Same-origin in dev: the browser calls /api and Vite forwards it to the API.
      // In production Nginx plays the same role, so no CORS is required.
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          // If the API is down, answer immediately instead of leaving the request hanging.
          configure: (proxy) => {
            proxy.on('error', (_error, _request, response) => {
              if ('writeHead' in response && !response.headersSent) {
                response.writeHead(502, { 'Content-Type': 'application/json' })
                response.end(
                  JSON.stringify({
                    title: 'Bad Gateway',
                    detail: `El API no está disponible en ${proxyTarget}.`,
                  }),
                )
              }
            })
          },
        },
        '/hubs': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            tanstack: ['@tanstack/react-query', '@tanstack/react-table'],
          },
        },
      },
    },
  }
})
