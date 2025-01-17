/**
 * @typedef {import('./autonomicstate').AutonomicState} AutonomicState
 * @typedef {import('./developmentstate').DevelopmentState} DevelopmentState
 * @typedef {import('./validationstate').ValidationState} ValidationState
 */

/**
 * @typedef {Object} AutonomicDevelopmentHook
 * @property {function(): AutonomicState} useAutonomicState - Get current autonomic state
 * @property {function(): DevelopmentState} useDevelopmentState - Get current development state
 * @property {function(AutonomicState): Promise<void>} updateAutonomicState - Update autonomic state
 * @property {function(DevelopmentState): Promise<void>} updateDevelopmentState - Update development state
 * @property {function(): ValidationState} useValidationState - Get current validation state
 * @property {function(): boolean} isAutonomicActive - Check if autonomic system is active
 * @property {function(): boolean} isDevelopmentActive - Check if development is active
 */

/**
 * @typedef {Object} AutonomicDevelopmentConfig
 * @property {boolean} enableAutonomic - Whether to enable autonomic system
 * @property {boolean} enableDevelopment - Whether to enable development
 * @property {Object} thresholds - System thresholds
 * @property {number} thresholds.autonomic - Autonomic activation threshold
 * @property {number} thresholds.development - Development activation threshold
 * @property {Object} intervals - Update intervals
 * @property {number} intervals.autonomic - Autonomic update interval in ms
 * @property {number} intervals.development - Development update interval in ms
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};