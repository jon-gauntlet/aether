import { expect } from '@jest/globals';

interface CustomMatchers<R = boolean> {
  toBeInRange(min: number, max: number): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
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
