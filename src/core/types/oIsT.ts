/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toBeInRange(min: number, max: number): boolean;
    }
  }
}

declare module 'expect' {
  interface Matchers<R, T> {
    toBeInRange(min: number, max: number): boolean;
  }
}

declare module '@jest/expect' {
  interface Matchers<R, T> {
    toBeInRange(min: number, max: number): boolean;
  }
}

export {};