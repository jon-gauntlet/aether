/**
 * @typedef {import('./consciousnessstate').ConsciousnessState} ConsciousnessState
 * @typedef {import('../../types/base').FlowMetrics} FlowMetrics
 */

/**
 * @typedef {Object} PredictionMetrics
 * @property {number} accuracy - Prediction accuracy score
 * @property {number} confidence - Prediction confidence level
 * @property {number} reliability - Prediction reliability score
 * @property {number} precision - Prediction precision level
 * @property {number} recall - Prediction recall score
 * @property {Object} history - Historical metrics
 * @property {number[]} history.accuracy - Accuracy history
 * @property {number[]} history.confidence - Confidence history
 * @property {Object} trends - Metric trends
 * @property {number} trends.accuracy - Accuracy trend
 * @property {number} trends.confidence - Confidence trend
 * @property {FlowMetrics} flowMetrics - Associated flow metrics
 * @property {ConsciousnessState} state - Associated consciousness state
 */

// Export type definitions for TypeScript-like type checking in JavaScript
export const Types = {};