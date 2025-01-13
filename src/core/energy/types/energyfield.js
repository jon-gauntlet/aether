/**
 * Energy-based information system
 * Instead of messages in channels, we have energy flowing through space
 */

/**
 * @typedef {Object} Vector3D
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/**
 * @typedef {Object} EnergyField
 * @property {string} id
 * @property {number} intensity - Current energy level
 * @property {Vector3D} velocity - Direction and speed of information flow
 * @property {number} gravity - How strongly it attracts attention
 * @property {number} wavelength - Type of energy (focus, communication, etc)
 * @property {number} charge - Positive or negative impact on flow
 */

/**
 * @typedef {Object} InformationParticle
 * @property {string} id
 * @property {*} content
 * @property {number} energy
 * @property {Vector3D} momentum
 * @property {number} spin - How actively it's being discussed
 * @property {number} lifetime - How long it remains relevant
 * @property {Bond[]} bonds - Connections to other particles
 */

/**
 * @typedef {Object} FlowField
 * @property {InformationParticle[]} particles
 * @property {EnergyField[]} energyFields
 * @property {Map<string, number>} gradients - Energy gradients in space
 * @property {Barrier[]} barriers - Flow protection boundaries
 * @property {Attractor[]} attractors - Points of interest
 */

/**
 * @typedef {Object} Attractor
 * @property {string} id
 * @property {Vector3D} position
 * @property {number} strength
 * @property {AttractorType} type
 * @property {number[]} resonance - What types of information it attracts
 */

/**
 * @typedef {Object} Barrier
 * @property {string} id
 * @property {number} strength
 * @property {number} permeability - What can pass through
 * @property {number} lifetime - How long it lasts
 * @property {BoundingVolume} shape
 */

/**
 * @typedef {Object} Bond
 * @property {string} source
 * @property {string} target
 * @property {number} strength
 * @property {BondType} type
 * @property {number} lifetime
 */

/**
 * @typedef {Object} BoundingVolume
 * @property {Vector3D} center
 * @property {Vector3D} dimensions
 * @property {number} radius
 */

/**
 * @typedef {'focus'|'flow'|'rest'|'connect'} AttractorType
 */

/**
 * @typedef {'strong'|'weak'|'temporal'|'spatial'} BondType
 */

/**
 * @typedef {Object} EnergyGradient
 * @property {string} id
 * @property {Vector3D} direction
 * @property {number} magnitude
 * @property {string} source
 * @property {string} target
 */

/**
 * @typedef {Object} FlowMetrics
 * @property {number} energy
 * @property {number} momentum
 * @property {number} coherence
 * @property {number} resistance
 */

/**
 * @typedef {Object} FieldState
 * @property {string} id
 * @property {FlowMetrics} metrics
 * @property {Map<string, number>} gradients
 * @property {number} timestamp
 */ 