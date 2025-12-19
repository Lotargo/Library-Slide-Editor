import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output to Django static directory
    outDir: '../editor/static/editor/react',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  base: '/static/editor/react/', // Base URL for assets in production
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
