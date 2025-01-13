import { Observable } from 'rxjs';

/**
 * @typedef {Object} FlowState
 * @property {number} presence
 * @property {number} harmony
 * @property {number} rhythm
 * @property {number} resonance
 * @property {number} coherence
 */

/**
 * @typedef {Object} NaturalFlow
 * @property {number} presence
 * @property {number} harmony
 * @property {number} rhythm
 * @property {number} resonance
 * @property {number} coherence
 * @property {function(): Observable<number>} observeDepth
 * @property {function(): Observable<number>} observeEnergy
 * @property {function(): Observable<number>} observeFocus
 */

/**
 * @typedef {Object} EnergyState
 * @property {number} level
 * @property {number} quality
 * @property {number} stability
 * @property {number} protection
 */

/**
 * @typedef {Object} Connection
 * @property {string} from
 * @property {string} to
 * @property {'flow'|'presence'|'resonance'} type
 * @property {number} strength
 */

/**
 * @typedef {Object} FlowSpace
 * @property {string} id
 * @property {'meditation'|'focus'|'flow'} type
 * @property {NaturalFlow} flow
 * @property {number} depth
 * @property {Connection[]} connections
 */

/**
 * @typedef {Object} ConsciousnessState
 * @property {string} id
 * @property {'individual'|'collective'} type
 * @property {MindSpace} space
 * @property {FlowSpace[]} spaces
 * @property {Connection[]} connections
 * @property {Resonance} resonance
 * @property {number} depth
 * @property {Protection} protection
 * @property {EnergyState} energy
 */

/**
 * @typedef {Object} FlowMetrics
 * @property {number} velocity
 * @property {number} momentum
 * @property {number} resistance
 * @property {number} conductivity
 * @property {number} coherence
 * @property {number} resonance
 */

/**
 * @typedef {Object} FlowContext
 * @property {string} id
 * @property {string} type
 * @property {FlowState} state
 * @property {FlowMetrics} metrics
 * @property {Connection[]} connections
 * @property {number} depth
 */

/**
 * @typedef {Object} FlowPattern
 * @property {string} id
 * @property {string} type
 * @property {FlowState} state
 * @property {FlowMetrics} metrics
 * @property {string[]} context
 * @property {number} strength
 * @property {number} confidence
 */

/**
 * @typedef {Object} FlowTransition
 * @property {FlowState} from
 * @property {FlowState} to
 * @property {string} trigger
 * @property {number} duration
 * @property {FlowMetrics} metrics
 */

/**
 * @typedef {Object} FlowProtection
 * @property {number} level
 * @property {string} type
 * @property {string[]} triggers
 * @property {number} duration
 * @property {boolean} active
 */

/**
 * @typedef {Object} FlowResonance
 * @property {number} frequency
 * @property {number} amplitude
 * @property {number} phase
 * @property {string} type
 * @property {boolean} synchronized
 */

/**
 * @typedef {Object} FlowHistory
 * @property {FlowState[]} states
 * @property {FlowTransition[]} transitions
 * @property {FlowMetrics[]} metrics
 * @property {number} duration
 * @property {string[]} context
 */

/**
 * @typedef {Object} Field
 * @property {Object} center
 * @property {number} center.x
 * @property {number} center.y
 * @property {number} center.z
 * @property {number} radius
 * @property {number} strength
 * @property {Wave[]} waves
 */

/**
 * @typedef {Object} Wave
 * @property {number} frequency
 * @property {number} amplitude
 * @property {number} phase
 */

/**
 * @typedef {Object} Resonance
 * @property {number} frequency
 * @property {number} amplitude
 * @property {number} harmony
 * @property {Field} field
 * @property {number} essence
 */

/**
 * @typedef {Object} Protection
 * @property {number} strength
 * @property {number} level
 * @property {Field} field
 * @property {number} resilience
 * @property {number} adaptability
 */

/**
 * @typedef {Object} MindSpace
 * @property {string} id
 * @property {Resonance} resonance
 * @property {number} depth
 * @property {Connection[]} connections
 */

/**
 * @typedef {Object} ThoughtStream
 * @property {string} id
 * @property {'focus'|'explore'|'rest'|'connect'} type
 * @property {ConsciousnessState} state
 */

/**
 * @typedef {Object} ThoughtEvolution
 * @property {string} id
 * @property {ConsciousnessState} from
 * @property {ConsciousnessState} to
 * @property {number} depth
 */

/**
 * @typedef {'surface'|'shallow'|'deep'|'profound'} Depth
 */

/**
 * @typedef {Object} SystemMeta
 * @property {number} baseFrequency
 * @property {number} baseAmplitude
 * @property {number} baseHarmony
 * @property {Object} baseProtection
 * @property {number} baseProtection.strength
 * @property {number} baseProtection.resilience
 * @property {number} baseProtection.adaptability
 */

/**
 * @typedef {Object} Flow
 * @property {number} pace
 * @property {number} adaptability
 * @property {number} emergence
 * @property {number} balance
 */

/**
 * Check if a consciousness state has sufficient protection
 * @param {ConsciousnessState} state - State to check
 * @returns {boolean} Whether the state is protected
 */
export const isProtected = (state) => state.protection.strength >= 0.7;

/**
 * Check if a consciousness state is coherent
 * @param {ConsciousnessState} state - State to check
 * @returns {boolean} Whether the state is coherent
 */
export const isCoherent = (state) => state.resonance.harmony >= 0.7;

/**
 * Check if a consciousness state is in flow
 * @param {ConsciousnessState} state - State to check
 * @returns {boolean} Whether the state is flowing
 */
export const isFlowing = (state) => state.resonance.harmony >= 0.7;

/**
 * Check if an object is a valid MindSpace
 * @param {*} space - Object to check
 * @returns {boolean} Whether the object is a MindSpace
 */
export const isMindSpace = (space) => {
  return (
    typeof space === 'object' &&
    typeof space.id === 'string' &&
    typeof space.depth === 'number' &&
    Array.isArray(space.connections) &&
    space.connections.every(isConnection) &&
    isResonance(space.resonance)
  );
};

/**
 * Check if an object is a valid Resonance
 * @param {*} resonance - Object to check
 * @returns {boolean} Whether the object is a Resonance
 */
export const isResonance = (resonance) => {
  return (
    typeof resonance === 'object' &&
    typeof resonance.frequency === 'number' &&
    typeof resonance.amplitude === 'number' &&
    typeof resonance.harmony === 'number' &&
    typeof resonance.essence === 'number' &&
    isField(resonance.field)
  );
};

/**
 * Check if an object is a valid Field
 * @param {*} field - Object to check
 * @returns {boolean} Whether the object is a Field
 */
export const isField = (field) => {
  return (
    typeof field === 'object' &&
    typeof field.center === 'object' &&
    typeof field.center.x === 'number' &&
    typeof field.center.y === 'number' &&
    typeof field.center.z === 'number' &&
    typeof field.radius === 'number' &&
    typeof field.strength === 'number' &&
    Array.isArray(field.waves) &&
    field.waves.every(isWave)
  );
};

/**
 * Check if an object is a valid Wave
 * @param {*} wave - Object to check
 * @returns {boolean} Whether the object is a Wave
 */
export const isWave = (wave) => {
  return (
    typeof wave === 'object' &&
    typeof wave.frequency === 'number' &&
    typeof wave.amplitude === 'number' &&
    typeof wave.phase === 'number'
  );
};

/**
 * Check if an object is a valid Connection
 * @param {*} connection - Object to check
 * @returns {boolean} Whether the object is a Connection
 */
export const isConnection = (connection) => {
  return (
    typeof connection === 'object' &&
    typeof connection.from === 'string' &&
    typeof connection.to === 'string' &&
    typeof connection.strength === 'number' &&
    (connection.type === 'flow' ||
     connection.type === 'presence' ||
     connection.type === 'resonance')
  );
}; 