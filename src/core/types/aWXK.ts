/// <reference types="jest" />

declare module '@jest/expect' {
  interface AsymmetricMatchers {
    toBeInRange(min: number, max: number): void;
  }
  interface Matchers<R> {
    toBeInRange(min: number, max: number): R;
  }
} 