/**
 * @typedef {import('./flowstate').FlowState} FlowState
 * @typedef {import('../../../types/base').Resonance} Resonance
 * @typedef {import('../../../types/base').Field} Field
 */

/**
 * @typedef {Object} IntegrationHook
 * @property {function(): FlowState} useFlowState - Get current flow state
 * @property {function(): Resonance} useResonance - Get current resonance
 * @property {function(): Field} useField - Get current field
 * @property {function(FlowState): Promise<void>} updateFlow - Update flow state
 * @property {function(Resonance): Promise<void>} updateResonance - Update resonance
 * @property {function(Field): Promise<void>} updateField - Update field
 * @property {function(): boolean} isIntegrated - Check integration status
 * @property {function(): Promise<void>} integrate - Perform integration
 * @property {function(): Promise<void>} disintegrate - Remove integration
 */

/**
 * @typedef {Object} IntegrationConfig
 * @property {boolean} autoIntegrate - Whether to auto-integrate
 * @property {Object} thresholds - Integration thresholds
 * @property {number} thresholds.resonance - Resonance threshold
 * @property {number} thresholds.field - Field threshold
 * @property {Object} intervals - Update intervals
 * @property {number} intervals.flow - Flow update interval in ms
 * @property {number} intervals.resonance - Resonance update interval in ms
 * @property {number} intervals.field - Field update interval in ms
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};