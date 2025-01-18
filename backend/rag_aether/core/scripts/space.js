/**
 * Core Type System
 * 
 * This establishes the type hierarchy for the entire system.
 * The order of exports is significant:
 * 
 * 1. Foundational types (order.js)
 * 2. Structural types (structure.js)
 * 3. Consciousness types (consciousness.js)
 * 4. Flow types (flow.js)
 * 5. Space types (space.js)
 * 6. Validation functions (validation.js)
 */

// Import and re-export specific types to resolve conflicts
import { Connection } from './consciousness';
import { FlowType as CoreFlowType } from './order';
import { SpaceType as CoreSpaceType } from './order';
import { FlowType, SpaceType } from './flow';

// Re-export with explicit names
export { CoreFlowType, CoreSpaceType, FlowType, SpaceType };

// Re-export all other types
export * from './order';
export * from './consciousness';
export * from './flow';
export * from './space';

/**
 * @typedef {'focused'|'lively'|'casual'|'quiet'} Mood
 */

/**
 * @typedef {Object} Space
 * @property {string} id
 * @property {string} name
 * @property {string} purpose
 * @property {Object} character
 * @property {number} character.energy
 * @property {number} character.focus
 * @property {Mood} character.mood
 * @property {Connection[]} connections
 */

/**
 * @typedef {Object} Member
 * @property {string} id
 * @property {Object} focus
 * @property {number} focus.level
 * @property {number} focus.quality
 * @property {number} energy
 * @property {number} depth
 */

/**
 * @typedef {Object} Room
 * @property {string} id
 * @property {number} calm
 * @property {number} focus
 * @property {number} energy
 * @property {Connection[]} paths
 */

/**
 * @typedef {Object} Stage
 * @property {number} level
 * @property {number} quality
 * @property {number} energy
 */

/**
 * @typedef {Object} State
 * @property {Stage} focus
 * @property {Stage} flow
 * @property {number} depth
 */ 