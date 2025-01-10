import { expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import './matchers/toBeInRange';

expect.extend(matchers);

// Configure test environment
beforeAll(() => {
  // Add crypto polyfill for tests
  if (!global.crypto) {
    global.crypto = webcrypto as any;
  }

  // Configure testing-library
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup(); // Clean up after each test
});

afterAll(() => {
  // Add any additional test cleanup here
});

// Configure timeouts
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000,
});

// Configure console handling
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  if (
    args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
    args[0]?.includes?.('Warning: useLayoutEffect does nothing on the server')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  if (args[0]?.includes?.('Warning: React.createFactory()')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};