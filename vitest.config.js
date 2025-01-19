import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
        '**/setup.{js,jsx}',
        '.storybook/**',
        'storybook-static/**'
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
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
    passWithNoTests: false,
    threads: true,
    maxConcurrency: 5,
    minThreads: 1,
    maxThreads: 4
  }
}) 