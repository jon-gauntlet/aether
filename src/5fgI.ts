import { expect } from '@jest/globals';

const toBeInRange = function(
  received: unknown,
  min: number,
  max: number
): jest.CustomMatcherResult {
  if (typeof received !== 'number') {
    return {
      pass: false,
      message: () => `expected ${received} to be a number`,
    };
  }

  const pass = received >= min && received <= max;
  const message = pass
    ? () => `expected ${received} not to be within range ${min} - ${max}`
    : () => `expected ${received} to be within range ${min} - ${max}`;

  return { pass, message };
};

expect.extend({ toBeInRange });