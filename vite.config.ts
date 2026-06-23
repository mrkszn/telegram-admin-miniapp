import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as {
  version: string
}

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Split vendors by *individual package* (a function, not the object
        // form). The object form bucketed @tremor's shared deps — including
        // clsx / tailwind-merge used by the eager shell's cn() — into the
        // charts chunk, which dragged the whole 840 KB back into the entry.
        //
        //  - react   → framework, initial + long-term cacheable
        //  - charts  → Tremor + Recharts + d3, reached only via the lazy
        //              /metrics and /ask routes ⇒ stays an async chunk
        //  - vendor  → everything else (radix, lucide, axios, zustand, clsx…)
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // Force the React framework into its own long-cacheable chunk.
          // Match exact package roots so @tremor/react (path contains
          // "/react/") is NOT mistaken for the framework.
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router/') ||
            id.includes('/node_modules/react-router-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'react'
          }
          // Split the d3 / lodash sub-stack off the chart bundle. These are
          // pulled in only transitively by Recharts (never by the eager
          // shell), so the forced chunk stays async and just keeps the main
          // chart chunk comfortably under the size budget. Recharts + @tremor
          // themselves are left to Vite's auto-splitting so no shared shell
          // util gets bucketed with them (which would drag charts back into
          // the entry).
          if (
            id.includes('/d3-') ||
            id.includes('/victory-vendor/') ||
            id.includes('/lodash') ||
            id.includes('/internmap/') ||
            id.includes('decimal.js')
          ) {
            return 'charts-vendor'
          }
          // Everything else (incl. Recharts + @tremor) → Vite auto-split.
          // Chart libs are reached only from the lazy /metrics and /ask
          // chunks, so they land in an on-demand async chunk, not the entry.
          return
        },
      },
    },
    // Project threshold. After the work above the only large chunks are the
    // deferred chart bundles (~716 KB + 104 KB), loaded on demand — they sit
    // under this limit, so the build no longer warns. Not used to mask an
    // initial-bundle regression: charts are out of the critical path.
    chunkSizeWarningLimit: 800,
  },
})
