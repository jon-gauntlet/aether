/**
 * @typedef {import('../../types/base').FlowMetrics} FlowMetrics
 * @typedef {import('../../types/base').Resonance} Resonance
 * @typedef {import('../../types/base').Field} Field
 */

/**
 * @typedef {'space' | 'flow' | 'presence'} SpaceType
 */

/**
 * @typedef {'linear' | 'branching' | 'cyclical'} StreamType
 */

/**
 * @typedef {'deep' | 'light' | 'surface'} PresenceType
 */

/**
 * @typedef {Object} NaturalFlow
 * @property {string} id - Flow identifier
 * @property {'flow' | 'presence' | 'connection'} type - Flow type
 * @property {number} strength - Flow strength
 * @property {number} resonance - Flow resonance
 * @property {number} evolution - Flow evolution rate
 * @property {FlowMetrics} metrics - Flow metrics
 * @property {Field} field - Flow field
 */

/**
 * @typedef {Object} Space
 * @property {string} id - Space identifier
 * @property {SpaceType} type - Space type
 * @property {Field} field - Space field
 * @property {Resonance} resonance - Space resonance
 * @property {NaturalFlow[]} flows - Natural flows in space
 */

/**
 * @typedef {Object} Stream
 * @property {string} id - Stream identifier
 * @property {StreamType} type - Stream type
 * @property {number} intensity - Stream intensity
 * @property {number} coherence - Stream coherence
 * @property {NaturalFlow[]} flows - Flows in stream
 */

/**
 * @typedef {Object} ConsciousnessState
 * @property {string} id - State identifier
 * @property {number} level - Consciousness level
 * @property {number} clarity - Mental clarity
 * @property {number} presence - Presence level
 * @property {Stream} stream - Active thought stream
 * @property {Field} field - Consciousness field
 */

/**
 * @typedef {Object} FlowSpace
 * @property {string} id - Space identifier
 * @property {SpaceType} type - Space type
 * @property {NaturalFlow[]} flows - Natural flows
 * @property {Stream[]} streams - Active streams
 * @property {Field} field - Space field
 * @property {Resonance} resonance - Space resonance
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};