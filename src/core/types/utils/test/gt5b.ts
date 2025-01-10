import '@testing-library/jest-dom';
import './test/matchers/toBeInRange';
import { webcrypto } from 'node:crypto';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInRange(min: number, max: number): R extends void ? R : Promise<R>;
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

