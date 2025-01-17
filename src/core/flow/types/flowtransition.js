/**
 * @typedef {import('./flowstate').FlowState} FlowState
 */

/**
 * @typedef {Object} FlowTransition
 * @property {FlowState} from - Starting flow state
 * @property {FlowState} to - Target flow state
 * @property {number} duration - Transition duration in milliseconds
 * @property {number} quality - Transition quality score
 * @property {number} efficiency - Transition efficiency score
 */

/**
 * @typedef {Object} FlowProtection
 * @property {number} level - Protection level
 * @property {'natural' | 'enhanced' | 'autonomous' | 'standard'} type - Protection type
 * @property {number} strength - Protection strength
 * @property {number} resilience - Protection resilience
 * @property {number} adaptability - Protection adaptability
 * @property {boolean} active - Whether protection is active
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};