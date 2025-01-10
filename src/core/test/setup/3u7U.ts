import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import './test/matchers/toBeInRange';
import { webcrypto } from 'node:crypto';
import { beforeAll, afterAll } from 'vitest';

// Configure test environment
beforeAll(() => {
  // Add crypto polyfill for tests
  if (!global.crypto) {
    global.crypto = webcrypto as any;
  }
});

afterAll(() => {
  // Add any additional test cleanup here
});

// Add any additional test setup here