import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
      ],
    },
    minThreads: 1,
    maxThreads: 4,
    slowTestThreshold: 5000,
    fileParallelism: false,
    isolate: false,
    reporters: ['tap'],
    css: false,
    exclude: [
      'node_modules',
      'dist',
      '.storybook',
      'storybook-static'
    ],
    watchExclude: ['**/node_modules/**', '**/dist/**'],
    passWithNoTests: false
  }
}) 