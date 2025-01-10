import { jest, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import 'reflect-metadata';

// Mock Redis
jest.mock('ioredis', () => {
  const Redis = require('ioredis-mock');
  return Redis;
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://localhost:5432/chatgenius_test';

// Global test setup
beforeAll(async () => {
  // Add any global setup here
});

// Global test teardown
afterAll(async () => {
  // Add any global teardown here
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveResonance(): R;
      toHaveDepth(): R;
    }
  }
}

// Custom test matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  toHaveResonance(received: any) {
    const hasResonance = received &&
      typeof received.resonance === 'object' &&
      typeof received.resonance.frequency === 'number' &&
      typeof received.resonance.amplitude === 'number' &&
      typeof received.resonance.harmony === 'number';
    
    if (hasResonance) {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} not to have resonance properties`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} to have resonance properties`,
        pass: false,
      };
    }
  },
  toHaveDepth(received: any) {
    const hasDepth = received &&
      typeof received.depth === 'object' &&
      typeof received.depth.level === 'number' &&
      typeof received.depth.clarity === 'number' &&
      typeof received.depth.stillness === 'number' &&
      typeof received.depth.presence === 'number';
    
    if (hasDepth) {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} not to have depth properties`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} to have depth properties`,
        pass: false,
      };
    }
  },
}); 