import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.js?(x)'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.venv/**',
      '**/playwright/**',
      '**/coverage/**'
    ],
    coverage: {
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.venv/**',
        '**/playwright/**',
        '**/coverage/**'
      ]
    },
    pool: 'threads',
    maxConcurrency: 10,
    maxWorkers: 2,
    minWorkers: 1,
    fileParallelism: true
  }
}) 