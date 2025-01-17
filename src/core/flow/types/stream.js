/**
 * @typedef {import('../../types/base').FlowMetrics} FlowMetrics
 * @typedef {import('../../types/base').NaturalFlow} NaturalFlow
 * @typedef {import('../../types/base').Resonance} Resonance
 * @typedef {import('../../types/base').Field} Field
 */

/**
 * @typedef {'deep' | 'light' | 'surface'} PresenceType
 */

/**
 * @typedef {Object} Stream
 * @property {string} id - Stream identifier
 * @property {'flow' | 'presence' | 'connection'} type - Stream type
 * @property {number} intensity - Stream intensity
 * @property {number} coherence - Stream coherence
 * @property {number} stability - Stream stability
 * @property {Field} field - Stream field
 * @property {Resonance} resonance - Stream resonance
 * @property {NaturalFlow[]} flows - Active flows
 * @property {FlowMetrics} metrics - Stream metrics
 * @property {Object} history - Stream history
 * @property {number[]} history.intensity - Intensity history
 * @property {number[]} history.coherence - Coherence history
 * @property {number[]} history.stability - Stability history
 * @property {Object} trends - Stream trends
 * @property {number} trends.intensity - Intensity trend
 * @property {number} trends.coherence - Coherence trend
 * @property {number} trends.stability - Stability trend
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};