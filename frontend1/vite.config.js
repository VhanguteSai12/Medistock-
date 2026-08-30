import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',         // Cloudflare Pages reads from this folder
    sourcemap: false,        // Disable sourcemaps in production (smaller build)
    chunkSizeWarningLimit: 1000, // Suppress large chunk warnings during build
  },
  server: {
    port: 5173,              // Local dev port
  }
})
