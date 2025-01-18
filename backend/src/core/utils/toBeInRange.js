/**
 * Custom matcher to check if a number is within a range
 * @param {number} value - The value to check
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {Object} Matcher result
 */
export const toBeInRange = (value, min, max) => {
  const pass = typeof value === 'number' && value >= min && value <= max;
  return {
    message: () => pass
      ? `expected ${value} not to be within range ${min} - ${max}`
      : `expected ${value} to be within range ${min} - ${max}`,
    pass
  };
}; 