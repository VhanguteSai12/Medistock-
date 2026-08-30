import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Cloudflare Pages SPA Fallback Plugin
// Copies dist/index.html → dist/404.html after every build.
// Cloudflare Pages serves 404.html (with 200 status) for any
// URL that doesn't match a static file — this is how SPA routing works.
const cloudflareSpaFallback = {
  name: 'cloudflare-spa-fallback',
  closeBundle() {
    const distDir = path.resolve(import.meta.dirname, 'dist')
    const indexPath = path.join(distDir, 'index.html')
    const notFoundPath = path.join(distDir, '404.html')
    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, notFoundPath)
      console.log('✅ Copied dist/index.html → dist/404.html (Cloudflare SPA fallback)')
    }
  }
}

export default defineConfig({
  plugins: [react(), cloudflareSpaFallback],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
  }
})
