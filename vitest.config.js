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
    isolate: false,
    threads: true,
    pool: 'threads',
    minThreads: 8,
    maxThreads: 16,
    fileParallelism: false,
    css: false,
    concurrent: 10,
    exclude: [
      'node_modules',
      'dist',
      '.storybook',
      'storybook-static'
    ],
    reporters: ['verbose'],
    watch: false,
    watchExclude: ['**/node_modules/**', '**/dist/**'],
    passWithNoTests: false
  }
}) 