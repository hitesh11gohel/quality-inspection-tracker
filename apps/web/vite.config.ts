import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @ maps to src/ so imports are absolute-style: import X from '@/components/X'
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Forward /api requests to the Express backend in dev, avoiding CORS issues.
      // In production the hosting layer (nginx / cloud run) handles this routing.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
