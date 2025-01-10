import { describe, test, expect } from '@jest/globals';
import './toBeInRange';

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toBeInRange(min: number, max: number): R;
    }
  }
}

describe('toBeInRange matcher', () => {
  test('passes when number is within range', () => {
    expect(5).toBeInRange(1, 10);
  });

  test('fails when number is below range', () => {
    expect(() => expect(0).toBeInRange(1, 10))
      .toThrow('expected 0 to be within range 1 - 10');
  });

  test('fails when number is above range', () => {
    expect(() => expect(11).toBeInRange(1, 10))
      .toThrow('expected 11 to be within range 1 - 10');
  });

  test('passes when number equals floor', () => {
    expect(1).toBeInRange(1, 10);
  });

  test('passes when number equals ceiling', () => {
    expect(10).toBeInRange(1, 10);
  });
});