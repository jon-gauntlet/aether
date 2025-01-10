/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R, T = unknown> {
      toBeInRange(min: number, max: number): R extends void ? boolean : Promise<boolean>;
    }
  }
}

declare module '@jest/expect' {
  interface Matchers<R, T = unknown> {
    toBeInRange(min: number, max: number): R extends void ? boolean : Promise<boolean>;
  }
}

