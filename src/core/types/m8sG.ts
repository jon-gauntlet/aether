import { expect } from '@jest/globals';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInRange(floor: number, ceiling: number): R;
    }
  }
}

expect.extend({
  toBeInRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
}); 