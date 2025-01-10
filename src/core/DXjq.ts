import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with testing-library methods
expect.extend(matchers);

// Configure testing-library
configure({
  testIdAttribute: 'data-testid',
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});