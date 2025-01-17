import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Performance optimization: Use a single timer mock for all tests
const timerConfig = {
  shouldAdvanceTime: true,
  advanceTimeDelta: 10,
};

// Setup phase
beforeAll(() => {
  vi.useFakeTimers(timerConfig);
  
  // Batch mock setup for better performance
  const mockImplementations = {
    matchMedia: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    ResizeObserver: vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })),
    IntersectionObserver: vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })),
    requestAnimationFrame: vi.fn(cb => setTimeout(cb, 0)),
    cancelAnimationFrame: vi.fn(id => clearTimeout(id)),
  };

  // Apply all mocks in one batch
  Object.entries(mockImplementations).forEach(([key, implementation]) => {
    Object.defineProperty(window, key, {
      writable: true,
      configurable: true,
      value: implementation,
    });
  });
});

// Cleanup phase
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

// Optimized React 18 mock
vi.mock('react-dom/client', () => {
  const root = {
    render: vi.fn(),
    unmount: vi.fn(),
  };
  return {
    createRoot: vi.fn(() => root),
  };
}); 