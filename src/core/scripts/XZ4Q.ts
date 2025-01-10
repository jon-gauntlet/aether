/// <reference types="jest" />

type MatcherFunction<T = unknown> = (
  this: jest.MatcherContext,
  received: T,
  ...args: any[]
) => jest.CustomMatcherResult;

declare global {
  namespace jest {
    interface Matchers<R extends void | Promise<void>, T = unknown> {
      toBeInRange(min: number, max: number): R;
    }
    interface ExpectExtendMap {
      toBeInRange: MatcherFunction<number>;
    }
  }
}

export {};