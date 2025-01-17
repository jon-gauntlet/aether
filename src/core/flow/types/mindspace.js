/**
 * @typedef {import('../../types/base').FlowMetrics} FlowMetrics
 * @typedef {import('../../types/base').Resonance} Resonance
 * @typedef {import('../../types/base').Protection} Protection
 * @typedef {import('../../types/base').NaturalFlow} NaturalFlow
 */

/**
 * @typedef {Object} MindSpace
 * @property {string} id - Space identifier
 * @property {'flow' | 'presence' | 'connection'} type - Space type
 * @property {Protection} protection - Space protection
 * @property {Resonance} resonance - Space resonance
 * @property {NaturalFlow[]} patterns - Natural flow patterns
 * @property {SpaceStats} stats - Space statistics
 * @property {FlowMetrics} metrics - Flow metrics
 * @property {Object} dimensions - Space dimensions
 * @property {number} dimensions.width - Space width
 * @property {number} dimensions.height - Space height
 * @property {number} dimensions.depth - Space depth
 */

/**
 * @typedef {Object} SpaceStats
 * @property {number} stability - Space stability
 * @property {number} coherence - Space coherence
 * @property {number} harmony - Space harmony
 * @property {number} evolution - Space evolution rate
 * @property {Object} history - Historical stats
 * @property {number[]} history.stability - Stability history
 * @property {number[]} history.coherence - Coherence history
 * @property {number[]} history.harmony - Harmony history
 * @property {Object} trends - Statistical trends
 * @property {number} trends.stability - Stability trend
 * @property {number} trends.coherence - Coherence trend
 * @property {number} trends.harmony - Harmony trend
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};