/**
 * Custom Jest matchers for enhanced testing capabilities
 */
declare global {
  namespace jest {
    interface Matchers<R, T> {
      /**
       * Checks if a number is within the specified range (inclusive)
       * @param min The minimum value of the range
       * @param max The maximum value of the range
       */
      toBeInRange(min: number, max: number): R;

      /**
       * Checks if a value matches the flow state interface
       */
      toBeValidFlowState(): R;

      /**
       * Checks if a value matches the protection state interface
       */
      toBeValidProtectionState(): R;

      /**
       * Checks if metrics are within valid ranges (0-1)
       */
      toHaveValidMetrics(): R;
    }
  }
}

export {};