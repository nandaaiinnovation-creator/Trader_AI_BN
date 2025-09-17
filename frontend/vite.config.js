import { defineConfig } from 'vite'

// Minimal Vite config for local dev/E2E: do NOT import
// `@vitejs/plugin-react` to avoid ESM-only loading errors in some
// Node/esbuild environments. esbuild's JSX transform is sufficient here.
export default defineConfig({
  plugins: [],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/socket.io': {
        target: 'http://localhost:8080',
        ws: true
      }
    }
  }
})
