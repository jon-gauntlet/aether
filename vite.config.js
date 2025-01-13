/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@types': path.resolve(__dirname, './src/core/types'),
      '@styles': path.resolve(__dirname, './src/styles')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
      ]
    },
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    transformMode: {
      web: [/\.jsx?$/]
    }
  },
  build: {
    target: 'es2022',
    sourcemap: true
  }
}); 