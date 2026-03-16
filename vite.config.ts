import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        // Don't log stack traces for ECONNREFUSED — API server may still be starting
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if ((err as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
              if ('writeHead' in res) {
                res.writeHead(503, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'API server not ready' }))
              }
            }
          })
        },
      },
    },
  },
  build: {
    rollupOptions: {
      external: ['react-grid-layout/css/styles.css'],
    },
  },
})
