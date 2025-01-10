import { expect } from '@jest/globals';

type MatcherFunction = (
  this: jest.MatcherContext,
  received: number,
  min: number,
  max: number
) => jest.CustomMatcherResult;

const toBeInRange: MatcherFunction = function(
  this: jest.MatcherContext,
  received: number,
  min: number,
  max: number
) {
  const pass = received >= min && received <= max;
  const message = pass
    ? () => `expected ${received} not to be within range ${min} - ${max}`
    : () => `expected ${received} to be within range ${min} - ${max}`;

  return { pass, message };
};

expect.extend({ toBeInRange });