import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: false, // disable HMR for testing purposes
  },
  // optimizeDeps: {
  //   exclude: ['lucide-react'],
  // },
})