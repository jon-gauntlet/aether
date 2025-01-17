/**
 * @typedef {import('./flowstate').FlowState} FlowState
 * @typedef {import('./flowmetrics').FlowMetrics} FlowMetrics
 */

/**
 * @typedef {'natural' | 'guided' | 'autonomous'} FlowType
 */

/**
 * @typedef {'shallow' | 'medium' | 'deep'} FlowDepth
 */

/**
 * @typedef {Object} FlowPattern
 * @property {string} id - Pattern identifier
 * @property {FlowType} type - Pattern type
 * @property {FlowDepth} depth - Pattern depth
 * @property {number} strength - Pattern strength
 * @property {number} frequency - Pattern frequency
 * @property {number} success - Pattern success rate
 * @property {FlowMetrics} metrics - Pattern metrics
 */

/**
 * @typedef {Object} FlowContext
 * @property {string} id - Context identifier
 * @property {FlowState} state - Current flow state
 * @property {FlowPattern[]} patterns - Active patterns
 * @property {FlowMetrics} metrics - Context metrics
 */

/**
 * @typedef {Object} Field
 * @property {Object} center - Field center coordinates
 * @property {number} center.x - X coordinate
 * @property {number} center.y - Y coordinate
 * @property {number} center.z - Z coordinate
 * @property {number} radius - Field radius
 * @property {number} strength - Field strength
 * @property {number} coherence - Field coherence
 * @property {number} stability - Field stability
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};