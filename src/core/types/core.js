/**
 * @typedef {import('./base').FlowMetrics} FlowMetrics
 * @typedef {import('./base').Field} Field
 * @typedef {import('./base').Resonance} Resonance
 */

/**
 * @typedef {Object} Flow
 * @property {string} id - Flow identifier
 * @property {'natural' | 'guided' | 'autonomous'} type - Flow type
 * @property {number} strength - Flow strength
 * @property {number} stability - Flow stability
 * @property {Field} field - Flow field
 * @property {Resonance} resonance - Flow resonance
 * @property {FlowMetrics} metrics - Flow metrics
 */

/**
 * @typedef {Object} Wave
 * @property {string} id - Wave identifier
 * @property {number} frequency - Wave frequency
 * @property {number} amplitude - Wave amplitude
 * @property {number} phase - Wave phase
 * @property {number} coherence - Wave coherence
 * @property {number} stability - Wave stability
 * @property {Field} field - Wave field
 */

// Re-export everything from metrics and state
export * from './metrics';
export * from './state';

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {}; 