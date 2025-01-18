import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['**/node_modules/**', '**/dist/**']
  },
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '/shared',
      '@components': '/src/components',
      '@hooks': '/src/hooks',
      '@contexts': '/src/contexts',
      '@theme': '/src/theme',
      '@utils': '/shared/utils',
      '@constants': '/shared/constants'
    }
  }
})
