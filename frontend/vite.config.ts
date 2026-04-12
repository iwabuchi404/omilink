import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import checker from 'vite-plugin-checker'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    checker({
      vueTsc: true,
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8090',
      '/_/': 'http://127.0.0.1:8090'
    }
  },
  build: {
    outDir: '../pocketbase/pb_public',
    emptyOutDir: true
  }
})
