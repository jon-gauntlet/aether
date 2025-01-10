/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInRange(min: number, max: number): R;
    }
  }
}

declare module '@jest/expect' {
  interface Matchers<R> {
    toBeInRange(min: number, max: number): R;
  }
}

export {};