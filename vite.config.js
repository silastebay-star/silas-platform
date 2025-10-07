import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/store": path.resolve(__dirname, "./src/store"),
      "@/config": path.resolve(__dirname, "./src/config"),
      "@/styles": path.resolve(__dirname, "./src/styles"),
      "@/assets": path.resolve(__dirname, "./src/assets")
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      'maplibre-gl',
      '@supabase/supabase-js',
      'framer-motion',
      'zustand'
    ]
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          map: ['mapbox-gl'],
          ui: ['framer-motion', 'lucide-react'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
})
