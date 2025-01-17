/**
 * @typedef {import('./flowstate').NaturalFlow} NaturalFlow
 * @typedef {import('../../types/base').Resonance} Resonance
 * @typedef {import('../../types/base').Field} Field
 */

/**
 * @typedef {Object} ConsciousnessState
 * @property {string} id - Unique identifier
 * @property {number} level - Consciousness level
 * @property {number} clarity - Mental clarity score
 * @property {number} presence - Presence level
 * @property {ThoughtStream} stream - Active thought stream
 * @property {Field} field - Consciousness field
 */

/**
 * @typedef {Object} ThoughtStream
 * @property {string} id - Stream identifier
 * @property {'linear' | 'branching' | 'cyclical'} type - Stream type
 * @property {number} intensity - Stream intensity
 * @property {number} coherence - Stream coherence
 * @property {ThoughtEvolution} evolution - Stream evolution
 */

/**
 * @typedef {Object} ThoughtEvolution
 * @property {number} rate - Evolution rate
 * @property {number} complexity - Evolution complexity
 * @property {number} stability - Evolution stability
 * @property {NaturalFlow[]} patterns - Evolution patterns
 */

/**
 * @typedef {Object} Point
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} z - Z coordinate
 * @property {number} intensity - Point intensity
 */

/**
 * @typedef {Object} Depth
 * @property {number} level - Depth level
 * @property {number} stability - Depth stability
 * @property {number} clarity - Depth clarity
 */

/**
 * @typedef {Object} MindSpace
 * @property {string} id - Space identifier
 * @property {Point[]} points - Space points
 * @property {Depth} depth - Space depth
 * @property {Field} field - Space field
 * @property {Resonance} resonance - Space resonance
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};