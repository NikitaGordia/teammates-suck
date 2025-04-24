import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses
    port: 5173,
    strictPort: true, // Don't try another port if 5173 is in use
    hmr: {
      // Enable HMR for Docker
      clientPort: 5173, // The port the client will connect to
      host: 'localhost', // The host the client will connect to
    },
    watch: {
      usePolling: true, // Needed for Docker volumes
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
  },
})
