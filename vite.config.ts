import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

/**
 * Replaces the `__SW_VERSION__` placeholder in dist/sw.js with a hash derived
 * from the bundled assets. This guarantees that every deploy ships a service
 * worker whose `CACHE_NAME` is unique, which forces the browser to drop the
 * previous cache on activation.
 */
function injectSwVersion(): Plugin {
  return {
    name: 'inject-sw-version',
    apply: 'build',
    closeBundle: {
      sequential: true,
      handler() {
        const distDir = path.resolve(__dirname, 'dist')
        const swPath = path.join(distDir, 'sw.js')
        if (!fs.existsSync(swPath)) return

        // Hash the JS/CSS bundles in dist/assets so the version changes
        // whenever the actual app code changes.
        const assetsDir = path.join(distDir, 'assets')
        const hash = crypto.createHash('sha256')
        if (fs.existsSync(assetsDir)) {
          for (const file of fs.readdirSync(assetsDir).sort()) {
            hash.update(file)
            try {
              hash.update(fs.readFileSync(path.join(assetsDir, file)))
            } catch {
              // Skip unreadable files; the filename alone still contributes.
            }
          }
        }
        const version = hash.digest('hex').slice(0, 12) || `t${Date.now().toString(36)}`

        const original = fs.readFileSync(swPath, 'utf8')
        const updated = original.replace(/__SW_VERSION__/g, version)
        fs.writeFileSync(swPath, updated, 'utf8')
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), injectSwVersion()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('i18next')) return 'i18n'
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor'
            return 'vendor'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
