/**
 * @typedef {import('../../types/base').FlowState} FlowState
 * @typedef {import('../../types/base').Field} Field
 * @typedef {import('../../types/base').FlowMetrics} FlowMetrics
 */

/**
 * @typedef {Object} ConsciousnessMetrics
 * @property {number} clarity - Mental clarity level
 * @property {number} presence - Presence level
 * @property {number} awareness - Awareness level
 * @property {number} focus - Focus level
 * @property {number} stability - Stability level
 * @property {FlowMetrics} flowMetrics - Associated flow metrics
 */

/**
 * @typedef {Object} ConsciousnessField
 * @property {Field} field - Base field properties
 * @property {number} coherence - Field coherence
 * @property {number} intensity - Field intensity
 * @property {number} stability - Field stability
 * @property {ConsciousnessMetrics} metrics - Field metrics
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};