/// <reference types="jest" />

type JestMatcher = (
  received: unknown,
  ...args: unknown[]
) => jest.CustomMatcherResult;

declare global {
  namespace jest {
    interface Matchers<R extends void | Promise<void>, T = unknown> {
      toBeInRange(min: number, max: number): R;
    }
    interface ExpectExtendMap {
      toBeInRange: JestMatcher;
    }
  }
}

export {};