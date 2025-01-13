import { Connection } from './index';
import { EnergyState, Protection, Resonance } from './energy';
import { MindSpace } from './space';
import { FlowSpace, NaturalFlow } from './flow';

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
 * @property {NaturalFlow} flow
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
 * Check if an object is a valid ConsciousnessState
 * @param {*} state - Object to check
 * @returns {boolean} Whether the object is a ConsciousnessState
 */
export const isConsciousnessState = (state) => {
  return (
    typeof state === 'object' &&
    typeof state.id === 'string' &&
    (state.type === 'individual' || state.type === 'collective') &&
    Array.isArray(state.spaces) &&
    Array.isArray(state.connections) &&
    typeof state.depth === 'number'
  );
};

/**
 * Check if an object is a valid ThoughtStream
 * @param {*} stream - Object to check
 * @returns {boolean} Whether the object is a ThoughtStream
 */
export const isThoughtStream = (stream) => {
  return (
    typeof stream === 'object' &&
    typeof stream.id === 'string' &&
    ['focus', 'explore', 'rest', 'connect'].includes(stream.type) &&
    isConsciousnessState(stream.state)
  );
}; 