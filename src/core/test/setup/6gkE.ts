import './matchers/toBeInRange';
import '@testing-library/jest-dom';
import { webcrypto } from 'node:crypto';

// Configure test environment
beforeAll(() => {
  // Add crypto polyfill for tests
  if (!global.crypto) {
    global.crypto = webcrypto as any;
  }
});

afterAll(() => {
  // Add any global test cleanup here
});

// Add any additional test setup here 