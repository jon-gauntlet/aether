/**
 * @typedef {import('../../types/base').FlowState} FlowState
 * @typedef {import('../../types/base').FlowMetrics} FlowMetrics
 */

/**
 * @typedef {'shallow' | 'medium' | 'deep'} FlowLevel
 */

/**
 * @typedef {Object} FlowSession
 * @property {string} id - Session identifier
 * @property {Date} startTime - Session start time
 * @property {Date} [endTime] - Session end time
 * @property {FlowLevel} level - Flow depth level
 * @property {FlowState} state - Current flow state
 * @property {FlowMetrics} metrics - Session metrics
 * @property {number} duration - Session duration in milliseconds
 * @property {boolean} isActive - Whether session is active
 * @property {boolean} isProtected - Whether session is protected
 * @property {Object} history - Session history
 * @property {FlowState[]} history.states - State history
 * @property {FlowMetrics[]} history.metrics - Metrics history
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};