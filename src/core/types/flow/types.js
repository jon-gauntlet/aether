/**
 * @typedef {Object} FlowState
 * @property {number} depth - Flow state depth
 * @property {boolean} active - Whether flow is active
 * @property {boolean} protected - Whether flow is protected
 */

/**
 * @typedef {Object} FlowMetrics
 * @property {number} focus - Focus level
 * @property {number} clarity - Mental clarity
 * @property {number} energy - Energy level
 */

/**
 * @typedef {Object} FlowPattern
 * @property {string} id - Pattern identifier
 * @property {string} type - Pattern type
 * @property {number} strength - Pattern strength
 */

// Factory functions for creating objects
export const createFlowState = () => ({
  depth: 0,
  active: false,
  protected: false
});

export const createFlowMetrics = () => ({
  focus: 0,
  clarity: 0,
  energy: 0
});

export const createFlowPattern = (id, type) => ({
  id,
  type,
  strength: 1
});

// Helper functions
export const isInFlow = (state) => state.active && state.depth > 0;
export const isProtected = (state) => state.protected;

