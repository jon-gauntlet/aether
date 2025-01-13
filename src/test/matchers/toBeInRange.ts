import { expect } from 'vitest';

declare global {
  namespace Vi {
    interface Assertion {
      toBeInRange(min: number, max: number): void;
    }
    interface AsymmetricMatchersContaining {
      toBeInRange(min: number, max: number): void;
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