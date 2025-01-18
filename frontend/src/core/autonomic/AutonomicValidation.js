/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {number} safetyScore
 * @property {number} protectionScore
 * @property {number} coherenceScore
 * @property {number} resonanceScore
 */

/**
 * @typedef {Object} ValidationState
 * @property {string} id
 * @property {string} currentState
 * @property {Object} metrics
 * @property {number} metrics.stability
 * @property {number} metrics.coherence
 * @property {number} metrics.resonance
 */

/**
 * @typedef {Object} ValidationHistory
 * @property {string} id
 * @property {string[]} stateHistory
 * @property {Object} metrics
 * @property {number} metrics.stability
 * @property {number} metrics.coherence
 * @property {number} metrics.resonance
 */

import { ACTION_TYPES } from '../types/constants';

/**
 * Validates autonomic actions based on current state and history
 * @param {Object} action - The action to validate
 * @param {ValidationState} state - The current validation state
 * @param {ValidationHistory} history - The validation history
 * @returns {ValidationResult} The validation result
 */
export const validateAutonomicAction = (action, state, history) => {
  // Calculate base scores with higher weights
  const stabilityImpact = Math.min(state.metrics.stability * history.metrics.stability * 1.2, 1);
  const coherenceImpact = Math.min(state.metrics.coherence * history.metrics.coherence * 1.2, 1);
  const resonanceImpact = Math.min(state.metrics.resonance * history.metrics.resonance * 1.2, 1);

  // Calculate scores with adjusted weights
  const safetyScore = calculateSafetyScore(action.type, stabilityImpact);
  const protectionScore = calculateProtectionScore(action.type, stabilityImpact);
  const coherenceScore = calculateCoherenceScore(action.type, coherenceImpact);
  const resonanceScore = calculateResonanceScore(action.type, resonanceImpact);

  // Action is valid if average score is above threshold
  const avgScore = (safetyScore + protectionScore + coherenceScore + resonanceScore) / 4;
  const isValid = avgScore > 0.5;

  return {
    isValid,
    safetyScore,
    protectionScore, 
    coherenceScore,
    resonanceScore
  };
};

/**
 * Calculate safety score for action
 * @param {string} actionType
 * @param {number} stabilityImpact
 * @returns {number}
 */
const calculateSafetyScore = (actionType, stabilityImpact) => {
  switch (actionType) {
    case ACTION_TYPES.FLOW_STATE_CHANGE:
      return Math.min(stabilityImpact * 1.2, 1);
    case ACTION_TYPES.PATTERN_UPDATE:
      return Math.min(stabilityImpact * 1.3, 1);
    default:
      return stabilityImpact;
  }
};

/**
 * Calculate protection score for action
 * @param {string} actionType
 * @param {number} stabilityImpact
 * @returns {number}
 */
const calculateProtectionScore = (actionType, stabilityImpact) => {
  switch (actionType) {
    case ACTION_TYPES.FLOW_STATE_CHANGE:
      return stabilityImpact * 0.85;
    case ACTION_TYPES.PATTERN_UPDATE:
      return stabilityImpact * 0.95;
    default:
      return stabilityImpact * 0.75;
  }
};

/**
 * Calculate coherence score for action
 * @param {string} actionType
 * @param {number} coherenceImpact
 * @returns {number}
 */
const calculateCoherenceScore = (actionType, coherenceImpact) => {
  switch (actionType) {
    case ACTION_TYPES.FLOW_STATE_CHANGE:
      return coherenceImpact * 0.9;
    case ACTION_TYPES.PATTERN_UPDATE:
      return coherenceImpact * 0.85;
    default:
      return coherenceImpact * 0.8;
  }
};

/**
 * Calculate resonance score for action
 * @param {string} actionType
 * @param {number} resonanceImpact
 * @returns {number}
 */
const calculateResonanceScore = (actionType, resonanceImpact) => {
  switch (actionType) {
    case ACTION_TYPES.FLOW_STATE_CHANGE:
      return resonanceImpact * 0.95;
    case ACTION_TYPES.PATTERN_UPDATE:
      return resonanceImpact * 0.9;
    default:
      return resonanceImpact * 0.85;
  }
}; 