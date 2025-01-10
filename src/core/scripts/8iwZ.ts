/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInRange(min: number, max: number): R extends void ? R : Promise<R>;
    }
  }
}

export {};