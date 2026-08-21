import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8601,
    proxy: { '/api': 'http://localhost:8600' },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // The figure essays are large HTML strings held in state, not in the
    // bundle, so the only real weight here is React and the router.
    chunkSizeWarningLimit: 700,
  },
});
