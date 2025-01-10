import { expect } from '@jest/globals';

declare global {
  namespace jest {
    interface Matchers<R, T = unknown> {
      toBeInRange(min: number, max: number): R;
    }
  }
}

expect.extend({
  toBeInRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${min} - ${max}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${min} - ${max}`,
        pass: false,
      };
    }
  },
});