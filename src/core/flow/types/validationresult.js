/**
 * @typedef {import('./validationstate').ValidationError} ValidationError
 * @typedef {import('./validationstate').ValidationWarning} ValidationWarning
 * @typedef {import('./validationstate').ValidationMetrics} ValidationMetrics
 */

/**
 * @typedef {Object} ValidationResult
 * @property {string} id - Result identifier
 * @property {boolean} valid - Overall validation result
 * @property {ValidationError[]} errors - Validation errors
 * @property {ValidationWarning[]} warnings - Validation warnings
 * @property {ValidationMetrics} metrics - Validation metrics
 * @property {Object} details - Additional details
 * @property {string} details.source - Validation source
 * @property {string} details.target - Validation target
 * @property {string} details.context - Validation context
 * @property {Object} performance - Performance metrics
 * @property {number} performance.duration - Validation duration in ms
 * @property {number} performance.memory - Memory usage in bytes
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};