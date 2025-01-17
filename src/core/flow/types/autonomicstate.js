/**
 * @typedef {import('../../types/base').FlowState} FlowState
 * @typedef {import('../../types/base').FlowMetrics} FlowMetrics
 * @typedef {import('../../types/base').Protection} Protection
 */

/**
 * @typedef {Object} AutonomicState
 * @property {string} id - Unique identifier
 * @property {'active' | 'passive' | 'protective'} mode - Current autonomic mode
 * @property {number} confidence - Confidence level
 * @property {number} adaptability - Adaptability score
 * @property {FlowState} flowState - Current flow state
 * @property {AutonomicMetrics} metrics - Autonomic metrics
 */

/**
 * @typedef {Object} AutonomicMetrics
 * @property {number} stability - System stability
 * @property {number} resilience - System resilience
 * @property {number} efficiency - System efficiency
 * @property {number} recovery - Recovery rate
 * @property {FlowMetrics} flowMetrics - Flow-specific metrics
 */

/**
 * @typedef {Object} AutonomicPattern
 * @property {string} id - Pattern identifier
 * @property {string} type - Pattern type
 * @property {number} frequency - Occurrence frequency
 * @property {number} confidence - Pattern confidence
 * @property {AutonomicMetrics} metrics - Pattern metrics
 */

/**
 * @typedef {Object} AutonomicValidation
 * @property {boolean} valid - Validation result
 * @property {string[]} errors - Validation errors
 * @property {string[]} warnings - Validation warnings
 * @property {AutonomicMetrics} metrics - Validation metrics
 */

/**
 * @typedef {Object} AutonomicTransition
 * @property {AutonomicState} from - Source state
 * @property {AutonomicState} to - Target state
 * @property {number} duration - Transition duration
 * @property {number} quality - Transition quality
 */

/**
 * @typedef {Object} AutonomicProtection
 * @property {number} level - Protection level
 * @property {'natural' | 'enhanced' | 'autonomous'} type - Protection type
 * @property {number} strength - Protection strength
 * @property {Protection} baseProtection - Base protection settings
 */

/**
 * @typedef {Object} AutonomicAnalytics
 * @property {number} confidence - Analysis confidence
 * @property {number} accuracy - Analysis accuracy
 * @property {AutonomicPattern[]} patterns - Detected patterns
 * @property {AutonomicMetrics} metrics - Analysis metrics
 */

/**
 * @typedef {Object} AutonomicCycle
 * @property {string} id - Cycle identifier
 * @property {number} iteration - Current iteration
 * @property {AutonomicState} state - Current state
 * @property {AutonomicMetrics} metrics - Cycle metrics
 */

/**
 * @typedef {Object} AutonomicOptimization
 * @property {number} efficiency - Optimization efficiency
 * @property {number} progress - Optimization progress
 * @property {AutonomicMetrics} metrics - Optimization metrics
 * @property {AutonomicPattern[]} improvements - Optimization improvements
 */

/**
 * @typedef {Object} AutonomicSystem
 * @property {string} id - System identifier
 * @property {AutonomicState} state - Current system state
 * @property {AutonomicProtection} protection - System protection
 * @property {AutonomicAnalytics} analytics - System analytics
 * @property {AutonomicOptimization} optimization - System optimization
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};