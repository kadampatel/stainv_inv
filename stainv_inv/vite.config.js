import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group all core React and essential libs to prevent circular errors
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-core';
            }
            // Isolate the heavy Firebase engine
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            // Isolate animations and icons
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Everything else goes here
            return 'vendor-utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 10000, // Effectively silences the warning so the build completes
  },
})