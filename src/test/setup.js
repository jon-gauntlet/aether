import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, render } from '@testing-library/react';
import { mockMatchMedia, mockLocalStorage } from '@/test/utils';
import { TestWrapper, renderWithProviders } from './TestWrapper';

// Export test utilities
export { TestWrapper, renderWithProviders };

// Mock window.matchMedia
window.matchMedia = mockMatchMedia;

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock ResizeObserver
window.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Mock IntersectionObserver
window.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Store original console methods
const originalConsole = {
  error: console.error,
  warn: console.warn
};

// Override console methods to suppress specific warnings
console.error = (...args) => {
  if (
    args[0]?.includes('Warning:') ||
    args[0]?.includes('defaultProps')
  ) {
    return;
  }
  originalConsole.error(...args);
};

console.warn = (...args) => {
  if (
    args[0]?.includes('Warning:') ||
    args[0]?.includes('defaultProps')
  ) {
    return;
  }
  originalConsole.warn(...args);
};

// Mock fetch globally
global.fetch = vi.fn();

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Restore original console methods after all tests
afterAll(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
}); 