import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5280'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: 5173,
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
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            'tanstack': ['@tanstack/react-query', '@tanstack/react-table'],
          },
        },
      },
    },
  }
})
