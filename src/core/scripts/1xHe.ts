/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R, T = unknown> {
      toBeInRange(min: number, max: number): R;
    }
  }
} 