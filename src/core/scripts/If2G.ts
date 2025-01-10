import '@testing-library/jest-dom';
import './test/matchers/toBeInRange';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInRange(min: number, max: number): R;
    }
  }
} 