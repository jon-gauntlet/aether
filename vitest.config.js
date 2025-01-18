import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
<<<<<<< HEAD
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    globals: true,
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/'
      }
    }
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY)
=======
    environment: 'node',
    setupFiles: ['./src/lib/test-setup.js'],
    globalSetup: ['./src/lib/test-global-setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/test-utils.js']
    }
>>>>>>> feature/infra
  }
}) 