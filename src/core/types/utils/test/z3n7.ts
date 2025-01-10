/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import type { jest as JestType, expect as ExpectType } from '@jest/globals';

declare global {
  const jest: typeof JestType;
  const expect: typeof ExpectType;
  
  namespace jest {
    interface Matchers<R> {
      toBeInRange(floor: number, ceiling: number): R;
    }
  }
}

