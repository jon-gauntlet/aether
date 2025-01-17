/**
 * @typedef {import('../../types/base').FlowMetrics} FlowMetrics
 * @typedef {import('../../types/base').FlowState} FlowState
 */

/**
 * @typedef {Object} ValidationState
 * @property {string} id - Validation identifier
 * @property {'active' | 'pending' | 'complete' | 'failed'} status - Validation status
 * @property {boolean} valid - Overall validation result
 * @property {ValidationMetrics} metrics - Validation metrics
 * @property {ValidationError[]} errors - Validation errors
 * @property {ValidationWarning[]} warnings - Validation warnings
 * @property {ValidationSuggestion[]} suggestions - Validation suggestions
 */

/**
 * @typedef {Object} ValidationMetrics
 * @property {number} accuracy - Validation accuracy
 * @property {number} coverage - Validation coverage
 * @property {number} confidence - Validation confidence
 * @property {number} performance - Validation performance
 * @property {FlowMetrics} flowMetrics - Associated flow metrics
 */

/**
 * @typedef {Object} ValidationPattern
 * @property {string} id - Pattern identifier
 * @property {string} type - Pattern type
 * @property {number} frequency - Pattern frequency
 * @property {number} confidence - Pattern confidence
 * @property {ValidationMetrics} metrics - Pattern metrics
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} id - Error identifier
 * @property {string} message - Error message
 * @property {string} code - Error code
 * @property {'critical' | 'major' | 'minor'} severity - Error severity
 * @property {Object} context - Error context
 * @property {string} context.source - Error source
 * @property {number} context.line - Error line number
 * @property {string} context.details - Additional details
 */

/**
 * @typedef {Object} ValidationWarning
 * @property {string} id - Warning identifier
 * @property {string} message - Warning message
 * @property {string} code - Warning code
 * @property {'high' | 'medium' | 'low'} priority - Warning priority
 * @property {Object} context - Warning context
 * @property {string} context.source - Warning source
 * @property {string} context.details - Additional details
 */

/**
 * @typedef {Object} ValidationSuggestion
 * @property {string} id - Suggestion identifier
 * @property {string} message - Suggestion message
 * @property {'required' | 'recommended' | 'optional'} importance - Suggestion importance
 * @property {Object} implementation - Implementation details
 * @property {string} implementation.code - Suggested code
 * @property {string} implementation.description - Implementation description
 */

/**
 * @typedef {Object} ValidationSystem
 * @property {string} id - System identifier
 * @property {ValidationState} state - Current validation state
 * @property {ValidationPattern[]} patterns - Validation patterns
 * @property {ValidationAnalytics} analytics - Validation analytics
 */

/**
 * @typedef {Object} TypeValidation
 * @property {string} id - Validation identifier
 * @property {string} type - Type being validated
 * @property {boolean} valid - Validation result
 * @property {ValidationError[]} errors - Type errors
 * @property {ValidationWarning[]} warnings - Type warnings
 * @property {ValidationMetrics} metrics - Validation metrics
 */

/**
 * @typedef {Object} ValidationAnalytics
 * @property {number} errorRate - Error rate
 * @property {number} warningRate - Warning rate
 * @property {number} successRate - Success rate
 * @property {Object} trends - Analytics trends
 * @property {number[]} trends.errorRates - Error rate history
 * @property {number[]} trends.warningRates - Warning rate history
 * @property {number[]} trends.successRates - Success rate history
 * @property {ValidationMetrics} metrics - Analytics metrics
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};