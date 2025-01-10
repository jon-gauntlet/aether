/// <reference types="jest" />
import { expect } from '@jest/globals';

expect.extend({
  toBeInRange(this: jest.MatcherContext, received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    const message = () =>
      pass
        ? `expected ${received} not to be within range ${min} - ${max}`
        : `expected ${received} to be within range ${min} - ${max}`;

    return {
      message,
      pass,
    };
  },
});