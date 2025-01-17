/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createDebugger } from './src/utils/debug';
import { resolve } from 'path';

const debug = createDebugger('ViteBuild');

// Common patterns to check
const PATTERNS = {
  RELATIVE_PARENT: {
    pattern: /from ['"]\.\.\//, 
    message: 'Avoid relative parent imports'
  },
  CONSOLE_LOGS: {
    pattern: /console\.(log|warn)/, 
    message: 'Remove console statements'
  },
  TODO_COMMENTS: {
    pattern: /\/\/\s*TODO/, 
    message: 'Resolve TODO comments'
  },
  DEBUGGER: {
    pattern: /debugger;/, 
    message: 'Remove debugger statements'
  },
  MAGIC_NUMBERS: {
    pattern: /\b\d{4,}\b(?!\s*[x\-+\/\*])/,
    message: 'Extract magic numbers to constants'
  }
};

// File patterns to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  '.git',
  'coverage',
  '__tests__',
  '__mocks__'
];

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'verify-imports',
      enforce: 'pre',
      transform(code, id) {
        // Skip ignored files
        if (IGNORE_PATTERNS.some(pattern => id.includes(pattern))) {
          return;
        }

        const warnings = [];
        
        // Check each pattern
        Object.entries(PATTERNS).forEach(([name, { pattern, message }]) => {
          if (pattern.test(code)) {
            warnings.push(`${message} in ${id}`);
          }
        });

        // Log warnings
        if (warnings.length > 0) {
          debug.warn('Build warnings:', warnings);
          warnings.forEach(warning => this.warn(warning));
        }
      }
    },
    {
      name: 'verify-dependencies',
      enforce: 'pre',
      configResolved(config) {
        // Check for duplicate dependencies
        const deps = new Set();
        const duplicates = new Set();
        
        Object.keys(config.optimizeDeps?.include || {}).forEach(dep => {
          if (deps.has(dep)) {
            duplicates.add(dep);
          }
          deps.add(dep);
        });
        
        if (duplicates.size > 0) {
          debug.warn('Duplicate dependencies:', Array.from(duplicates));
        }
      }
    },
    {
      name: 'verify-bundle',
      enforce: 'post',
      generateBundle(options, bundle) {
        // Check bundle size
        Object.entries(bundle).forEach(([fileName, chunk]) => {
          if (chunk.type === 'chunk' && chunk.code) {
            const sizeKB = chunk.code.length / 1024;
            if (sizeKB > 500) { // 500KB threshold
              debug.warn(`Large bundle chunk: ${fileName} (${sizeKB.toFixed(2)}KB)`);
            }
          }
        });
      }
    }
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor chunks
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Add size warnings
    chunkSizeWarningLimit: 500
  },
  server: {
    // Enable HMR
    hmr: true,
    // Add error overlay
    overlay: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    isolate: true,
    cache: {
      dir: '.vitest/cache'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.{js,jsx}',
        '**/__tests__/'
      ]
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true
      }
    },
    sequence: {
      shuffle: false
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
}); 