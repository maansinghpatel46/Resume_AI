import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin in development so the httpOnly auth cookie works without CORS tricks.
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
