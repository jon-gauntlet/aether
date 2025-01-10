import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with testing-library methods
expect.extend(matchers);

// Configure testing-library
configure({
  testIdAttribute: 'data-testid',
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
};

global.localStorage = localStorageMock;

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});