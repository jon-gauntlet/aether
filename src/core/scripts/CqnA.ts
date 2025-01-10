/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toBeInRange(min: number, max: number): R;
    }
  }
}

export {};