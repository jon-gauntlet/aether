/**
 * @typedef {Object} FlowState
 * @property {string} id - Flow ID
 * @property {boolean} active - Whether flow is active
 * @property {number} depth - Current flow depth
 * @property {boolean} protected - Whether flow is protected
 */

/**
 * @typedef {Object} FlowMetrics
 * @property {number} duration - Flow duration in seconds
 * @property {number} intensity - Flow intensity (0-1)
 * @property {number} consistency - Flow consistency (0-1)
 */

/**
 * @typedef {Object} FlowPattern
 * @property {string} id - Pattern ID
 * @property {string} type - Pattern type
 * @property {number} strength - Pattern strength (0-1)
 * @property {Object} metadata - Additional pattern metadata
 */

/**
 * Core flow management functions
 */

export const createFlowState = (id) => ({
  id,
  active: false,
  depth: 0,
  protected: false
});

export const createFlowMetrics = () => ({
  duration: 0,
  intensity: 0,
  consistency: 0
});

export const createFlowPattern = (id, type) => ({
  id,
  type,
  strength: 0,
  metadata: {}
});

export const isInFlow = (state) => state.active && state.depth > 0;

export const isProtected = (state) => state.protected;