import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    reporters: 'basic',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/setup/',
      ],
    },
    pool: 'forks',
    isolate: true,
    watchExclude: ['**/node_modules/**', '**/dist/**'],
    minThreads: 1,
    maxThreads: 4,
  },
}); 