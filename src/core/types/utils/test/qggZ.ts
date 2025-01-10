/// <reference types="jest" />

declare namespace jest {
  interface Matchers<R> {
    toBeInRange(min: number, max: number): R;
  }
}

