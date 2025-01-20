import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: false
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    maxConcurrency: 5,
    minThreads: 1,
    maxThreads: 4,
    fileParallelism: true,
    sequence: {
      shuffle: false
    },
    typecheck: {
      enabled: false
    },
    include: ['src/**/*.{test,spec}.{js,jsx}'],
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