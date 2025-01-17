/**
 * @typedef {import('./base').FlowMetrics} FlowMetrics
 * @typedef {import('./base').Field} Field
 */

/**
 * @typedef {Object} EnergyState
 * @property {string} id - Energy state identifier
 * @property {'charging' | 'discharging' | 'stable'} phase - Current energy phase
 * @property {number} current - Current energy level
 * @property {number} max - Maximum energy capacity
 * @property {number} min - Minimum energy threshold
 * @property {number} efficiency - Energy efficiency rating
 * @property {Field} field - Energy field
 * @property {EnergyMetrics} metrics - Energy metrics
 */

/**
 * @typedef {Object} EnergyMetrics
 * @property {number} consumption - Energy consumption rate
 * @property {number} generation - Energy generation rate
 * @property {number} stability - Energy stability score
 * @property {number} efficiency - Energy efficiency score
 * @property {FlowMetrics} flowMetrics - Associated flow metrics
 * @property {Object} history - Historical metrics
 * @property {number[]} history.consumption - Consumption history
 * @property {number[]} history.generation - Generation history
 * @property {Object} trends - Metric trends
 * @property {number} trends.consumption - Consumption trend
 * @property {number} trends.generation - Generation trend
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};