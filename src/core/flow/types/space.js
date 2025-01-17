/**
 * @typedef {import('../../types/base').FlowMetrics} FlowMetrics
 * @typedef {import('../../types/base').Resonance} Resonance
 * @typedef {import('../../types/base').Field} Field
 * @typedef {import('../../types/base').Protection} Protection
 */

/**
 * @typedef {'calm' | 'focused' | 'energetic' | 'collaborative'} SpaceMood
 */

/**
 * @typedef {'shallow' | 'medium' | 'deep'} FocusDepth
 */

/**
 * @typedef {'natural' | 'guided' | 'autonomous'} FlowType
 */

/**
 * Natural workspace dynamics
 * Everything flows and adapts like a living space
 * @typedef {Object} Space
 * @property {string} id - Space identifier
 * @property {SpaceMood} mood - Current space mood
 * @property {FocusDepth} focusDepth - Current focus depth
 * @property {FlowType} flowType - Current flow type
 * @property {Field} field - Space field
 * @property {Resonance} resonance - Space resonance
 * @property {Protection} protection - Space protection
 * @property {Flow[]} flows - Active flows
 * @property {Presence[]} presences - Active presences
 * @property {FlowMetrics} metrics - Space metrics
 */

/**
 * @typedef {Object} Flow
 * @property {string} id - Flow identifier
 * @property {FlowType} type - Flow type
 * @property {number} strength - Flow strength
 * @property {number} stability - Flow stability
 * @property {number} coherence - Flow coherence
 * @property {FlowMetrics} metrics - Flow metrics
 * @property {Field} field - Flow field
 */

/**
 * @typedef {Object} Presence
 * @property {string} id - Presence identifier
 * @property {'active' | 'passive' | 'observing'} mode - Presence mode
 * @property {number} strength - Presence strength
 * @property {number} stability - Presence stability
 * @property {number} influence - Presence influence
 * @property {Field} field - Presence field
 * @property {Protection} protection - Presence protection
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};