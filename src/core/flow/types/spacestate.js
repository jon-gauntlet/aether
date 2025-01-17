/**
 * @typedef {import('../../types/base').Connection} Connection
 * @typedef {import('./flowpattern').FlowPattern} FlowPattern
 * @typedef {import('../../types/base').FlowMetrics} FlowMetrics
 * @typedef {import('../../types/base').Field} Field
 */

/**
 * @typedef {'personal' | 'shared' | 'collaborative' | 'connection'} SpaceType
 */

/**
 * @typedef {Object} SpaceState
 * @property {string} id - Space identifier
 * @property {SpaceType} type - Space type
 * @property {boolean} active - Whether space is active
 * @property {number} stability - Space stability
 * @property {number} coherence - Space coherence
 * @property {Field} field - Space field
 * @property {FlowPattern[]} patterns - Active flow patterns
 * @property {Connection[]} connections - Active connections
 * @property {FlowMetrics} metrics - Space metrics
 * @property {Object} history - State history
 * @property {SpaceTransition[]} history.transitions - Transition history
 * @property {FlowMetrics[]} history.metrics - Metrics history
 */

/**
 * @typedef {Object} SpaceTransition
 * @property {string} id - Transition identifier
 * @property {SpaceState} from - Source state
 * @property {SpaceState} to - Target state
 * @property {number} duration - Transition duration
 * @property {number} quality - Transition quality
 * @property {FlowMetrics} metrics - Transition metrics
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};