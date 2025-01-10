import '@testing-library/jest-dom';
import './test/matchers/toBeInRange';
import { webcrypto } from 'node:crypto';

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toBeInRange(min: number, max: number): R;
    }
  }
}

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