import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: isDev ? {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        }
      } : undefined
    },
    define: {
      __DEV__: isDev,
    },
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'styled-vendor': ['styled-components'],
          'icons-vendor': ['react-icons', '@iconify/react'],
          'flags-vendor': ['flag-icons']
        },
        // Ensure chunks are optimally sized and have correct file extensions
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Set chunk size warnings
    chunkSizeWarningLimit: 500,
    // Target modern browsers for better optimization
    target: 'esnext',
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: true,
        drop_debugger: true,
        // Additional optimizations
        pure_funcs: ['console.log'],
        passes: 2
      },
      mangle: {
        safari10: true
      }
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Source maps only for debugging
    sourcemap: false
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'styled-components',
      'react-icons/hi2'
    ],
    exclude: ['@tanstack/react-query-devtools']
  }
  }
})
