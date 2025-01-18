/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./frontend/tests/setup.js'],
    include: ['tests/**/*.{test,spec,perf}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**'],
    testTimeout: 10000,
    reporters: ['default', 'json'],
    outputFile: {
      json: './test-results/performance.json'
    }
  }
}) 