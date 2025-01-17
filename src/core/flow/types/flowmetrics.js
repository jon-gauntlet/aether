/**
 * @typedef {Object} FlowMetrics
 * @property {number} intensity - Flow intensity level
 * @property {number} stability - Flow stability score
 * @property {number} conductivity - Flow conductivity measure
 * @property {number} velocity - Flow velocity measure
 * @property {number} focus - Focus level
 * @property {number} energy - Energy level
 */

/**
 * @typedef {Object} Wave
 * @property {number} frequency - Wave frequency
 * @property {number} amplitude - Wave amplitude
 * @property {number} phase - Wave phase
 * @property {number} coherence - Wave coherence
 */

/**
 * @typedef {Object} Resonance
 * @property {Wave} primary - Primary wave
 * @property {Wave[]} harmonics - Harmonic waves
 * @property {number} coherence - Overall coherence
 * @property {number} stability - Resonance stability
 */

/**
 * @typedef {Object} Protection
 * @property {number} level - Protection level
 * @property {'natural' | 'enhanced' | 'autonomous' | 'standard'} type - Protection type
 * @property {number} strength - Protection strength
 * @property {number} resilience - Protection resilience
 * @property {number} adaptability - Protection adaptability
 */

/**
 * @typedef {Object} Connection
 * @property {string} id - Connection identifier
 * @property {string} type - Connection type
 * @property {number} strength - Connection strength
 * @property {number} stability - Connection stability
 */

/**
 * @typedef {Object} FlowState
 * @property {boolean} active - Whether flow is active
 * @property {string} type - Flow state type
 * @property {FlowMetrics} metrics - Flow metrics
 * @property {Protection} protection - Flow protection
 * @property {Connection[]} connections - Flow connections
 */

/**
 * @typedef {Object} NaturalFlow
 * @property {string} id - Flow identifier
 * @property {'flow' | 'presence' | 'connection'} type - Flow type
 * @property {number} strength - Flow strength
 * @property {number} resonance - Flow resonance
 * @property {number} evolution - Flow evolution
 */

/**
 * Creates a default field configuration
 * @returns {Object} Default field configuration
 */
export function createDefaultField() {
  return {
    center: { x: 0, y: 0, z: 0 },
    radius: 1,
    strength: 1,
    coherence: 1,
    stability: 1
  };
}

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};