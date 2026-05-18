import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8220',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3001,
    host: '0.0.0.0',
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8220',
        changeOrigin: true,
      },
    },
  },
})
