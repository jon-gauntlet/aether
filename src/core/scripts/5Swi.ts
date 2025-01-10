/// <reference types="vitest" />
import { expect } from 'vitest'

interface CustomMatchers<R = unknown> {
  toBeInRange(min: number, max: number): R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  toBeInRange(actual: number, min: number, max: number) {
    const pass = actual >= min && actual <= max;
    
    return {
      pass,
      message: () => 
        pass 
          ? `expected ${actual} not to be within range ${min} - ${max}`
          : `expected ${actual} to be within range ${min} - ${max}`,
    };
  }
});