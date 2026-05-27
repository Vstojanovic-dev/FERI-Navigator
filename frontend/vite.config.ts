import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  cacheDir: '.vite-cache',
  build: {
    outDir: 'build-dist',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/maps': 'http://localhost:8080',
    },
  },
});
