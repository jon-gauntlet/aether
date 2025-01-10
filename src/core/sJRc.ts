/// <reference types="jest" />
import { expect } from '@jest/globals';

const toBeInRange = function(actual: number, min: number, max: number) {
  const pass = actual >= min && actual <= max;
  
  return {
    pass,
    message: () => 
      pass 
        ? `expected ${actual} not to be within range ${min} - ${max}`
        : `expected ${actual} to be within range ${min} - ${max}`,
  };
};

expect.extend({ toBeInRange });