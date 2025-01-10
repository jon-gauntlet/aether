/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toBeInRange(min: number, max: number): R;
    }
  }
}

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeInRange(min: number, max: number): void;
  }
  interface Matchers<R, T> {
    toBeInRange(min: number, max: number): R;
  }
}

export {};