import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
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
          'icons-vendor': ['react-icons'],
          
          // App chunks
          'auth': [
            './src/components/auth/SignIn.jsx',
            './src/components/auth/SignUp.jsx',
            './src/components/auth/EmailVerification.jsx',
            './src/components/auth/VerifyEmail.jsx'
          ],
          'dashboard': [
            './src/components/pages/Dashboard.jsx',
            './src/components/dashboard/ProfileSection.jsx',
            './src/components/dashboard/LinksSection.jsx',
            './src/components/dashboard/AnalyticsSection.jsx',
            './src/components/dashboard/CustomizationSection.jsx',
            './src/components/dashboard/QuickActionsSection.jsx'
          ],
          'ui-components': [
            './src/components/ui/Button.jsx',
            './src/components/ui/Input.jsx',
            './src/components/ui/Form.jsx',
            './src/components/ui/Card.jsx',
            './src/components/ui/Modal.jsx',
            './src/components/ui/Toast.jsx',
            './src/components/ui/Loading.jsx'
          ]
        },
        // Ensure chunks are optimally sized
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            const fileName = facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '')
            return `js/${fileName}-[hash].js`
          }
          return 'js/[name]-[hash].js'
        }
      }
    },
    // Set chunk size warnings
    chunkSizeWarningLimit: 500, // Smaller chunks for better loading
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
})
