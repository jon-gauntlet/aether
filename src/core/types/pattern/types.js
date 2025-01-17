/**
 * @typedef {Object} Pattern
 * @property {string} id - Pattern ID
 * @property {string} type - Pattern type
 * @property {number} strength - Pattern strength (0-1)
 * @property {Object} metadata - Additional pattern metadata
 */

/**
 * @typedef {Object} PatternMetrics
 * @property {number} frequency - Pattern frequency
 * @property {number} duration - Pattern duration
 * @property {number} intensity - Pattern intensity (0-1)
 */

/**
 * @typedef {Object} PatternContext
 * @property {string} source - Pattern source
 * @property {string} target - Pattern target
 * @property {Object} data - Pattern context data
 */

/**
 * Pattern types enum as constants
 */
export const PatternTypes = {
  FLOW: 'flow',
  ENERGY: 'energy',
  SPACE: 'space',
  SYSTEM: 'system'
};

/**
 * Core pattern management functions
 */

export const createPattern = (id, type = PatternTypes.FLOW) => ({
  id,
  type,
  strength: 0,
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

export const isPatternActive = (pattern) => pattern.strength > 0;

export const matchesPatternType = (pattern, type) => pattern.type === type;