import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json'

// The Go binary serves the built assets, so keep everything origin-relative.
// In dev, proxy API/mock/health calls to the backend on :4000 — mirrors production
// (same origin) and avoids CORS.
const BACKEND = 'http://localhost:4000'

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react(), tailwindcss()],
  server: {
    port: 3001,
    proxy: {
      '/core': BACKEND,
      '/mocktail': BACKEND,
      '/health': BACKEND,
    },
  },
  build: { outDir: 'build' },
})
