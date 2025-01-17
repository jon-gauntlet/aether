/**
 * @typedef {Object} Pattern
 * @property {string} id - Pattern identifier
 * @property {string} type - Pattern type
 * @property {number} strength - Pattern strength
 * @property {Object} metadata - Additional pattern data
 */

/**
 * @typedef {Object} PatternMetrics
 * @property {number} frequency - Pattern occurrence frequency
 * @property {number} duration - Pattern duration
 * @property {number} intensity - Pattern intensity
 */

/**
 * @typedef {Object} PatternContext
 * @property {string} source - Pattern source
 * @property {string} target - Pattern target
 * @property {Object} data - Context data
 */

// Pattern types as constants
export const PATTERN_TYPES = {
  FLOW: 'flow',
  ENERGY: 'energy', 
  SPACE: 'space',
  SYSTEM: 'system'
};

// Factory functions for creating objects
export const createPattern = (id, type = PATTERN_TYPES.FLOW) => ({
  id,
  type,
  strength: 1,
  metadata: {}
});

export const createPatternMetrics = () => ({
  frequency: 0,
  duration: 0,
  intensity: 0
});

export const createPatternContext = (source, target) => ({
  source,
  target,
  data: {}
});

// Helper functions
export const isPatternActive = (pattern) => pattern.strength > 0;
export const matchesPatternType = (pattern, type) => pattern.type === type;