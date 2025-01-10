/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R extends void | Promise<void>, T = unknown> {
      toBeInRange(min: number, max: number): R;
    }
  }
}

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeInRange(min: number, max: number): void;
  }
  interface Matchers<R extends void | Promise<void>, T = unknown> {
    toBeInRange(min: number, max: number): R;
  }
}

export {};