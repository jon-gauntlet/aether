/**
 * @typedef {import('./naturalflow').NaturalFlow} NaturalFlow
 * @typedef {import('../../../types/base').Field} Field
 * @typedef {import('../../../types/base').Resonance} Resonance
 */

/**
 * @typedef {Object} NaturalSystemHook
 * @property {function(): NaturalFlow[]} useNaturalFlows - Get current natural flows
 * @property {function(): Field} useField - Get current field
 * @property {function(): Resonance} useResonance - Get current resonance
 * @property {function(NaturalFlow): Promise<void>} addFlow - Add a natural flow
 * @property {function(string): Promise<void>} removeFlow - Remove a natural flow
 * @property {function(Field): Promise<void>} updateField - Update field
 * @property {function(Resonance): Promise<void>} updateResonance - Update resonance
 * @property {function(): boolean} isNatural - Check if system is in natural state
 * @property {function(): Promise<void>} harmonize - Harmonize the system
 * @property {function(): Promise<void>} destabilize - Destabilize the system
 */

/**
 * @typedef {Object} NaturalSystemConfig
 * @property {boolean} autoHarmonize - Whether to auto-harmonize
 * @property {Object} thresholds - System thresholds
 * @property {number} thresholds.harmony - Harmony threshold
 * @property {number} thresholds.resonance - Resonance threshold
 * @property {number} thresholds.stability - Stability threshold
 * @property {Object} limits - System limits
 * @property {number} limits.flows - Maximum number of flows
 * @property {number} limits.field - Maximum field strength
 * @property {Object} intervals - Update intervals
 * @property {number} intervals.flows - Flow update interval in ms
 * @property {number} intervals.field - Field update interval in ms
 * @property {number} intervals.resonance - Resonance update interval in ms
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};