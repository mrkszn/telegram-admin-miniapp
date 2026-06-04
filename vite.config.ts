import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
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
    // Tremor pulls in Recharts (~600 KB raw). Code-split charts into their
    // own chunk so the auth/shell critical path stays small.
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['@tremor/react'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
