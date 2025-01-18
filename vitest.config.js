import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/lib/test-setup.js'],
    globalSetup: ['./src/lib/test-global-setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/test-utils.js']
    }
  }
}) 