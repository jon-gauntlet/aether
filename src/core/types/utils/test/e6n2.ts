import '@testing-library/jest-dom';
import './test/matchers/toBeInRange';

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toBeInRange(min: number, max: number): R extends void ? boolean : Promise<boolean>;
    }
  }
