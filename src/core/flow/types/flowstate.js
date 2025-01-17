/**
 * @typedef {import('../../types/base').FlowMetrics} FlowMetrics
 * @typedef {import('../../types/base').NaturalFlow} NaturalFlow
 * @typedef {import('../../types/base').Resonance} Resonance
 */

/**
 * @typedef {'deep' | 'light' | 'surface'} PresenceType
 */

/**
 * @typedef {Object} FlowState
 * @property {boolean} active - Whether flow is active
 * @property {string} type - Type of flow state
 * @property {number} intensity - Flow intensity level
 * @property {number} duration - Duration in milliseconds
 * @property {FlowMetrics} metrics - Flow metrics
 * @property {number} lastTransition - Timestamp of last transition
 * @property {boolean} protected - Whether flow is protected
 * @property {number} quality - Flow quality score
 */

/**
 * @typedef {Object} Stream
 * @property {string} id - Stream identifier
 * @property {string} type - Stream type
 * @property {FlowState} state - Current flow state
 * @property {NaturalFlow[]} patterns - Associated patterns
 * @property {Resonance} resonance - Stream resonance
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};