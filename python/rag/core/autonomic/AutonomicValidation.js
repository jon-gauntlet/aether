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

import { ActionType } from '../types/constants';

/**
 * Validates autonomic actions based on current state and history
 * @param {ActionType} actionType - The type of action to validate
 * @param {ValidationState} state - The current validation state
 * @param {ValidationHistory} history - The validation history
 * @returns {ValidationResult} The validation result
 */
export const validateAutonomicAction = (actionType, state, history) => {
  // Calculate base scores
  const stabilityImpact = state.metrics.stability * history.metrics.stability;
  const coherenceImpact = state.metrics.coherence * history.metrics.coherence;
  const resonanceImpact = state.metrics.resonance * history.metrics.resonance;

  // Calculate safety score based on action type
  const safetyScore = calculateSafetyScore(actionType, stabilityImpact);
  
  // Calculate protection score
  const protectionScore = calculateProtectionScore(actionType, stabilityImpact);
  
  // Calculate coherence score
  const coherenceScore = calculateCoherenceScore(actionType, coherenceImpact);
  
  // Calculate resonance score
  const resonanceScore = calculateResonanceScore(actionType, resonanceImpact);

  // Adjust validation criteria based on action type
  const isValid = actionType === 'FORCE_TRANSITION' ? 
    safetyScore > 0.3 && protectionScore > 0.2 :
    safetyScore > 0.5 && protectionScore > 0.3;

  return {
    isValid,
    safetyScore,
    protectionScore,
    coherenceScore,
    resonanceScore
  };
};

/**
 * @param {ActionType} actionType
 * @param {number} stabilityImpact
 * @returns {number}
 */
const calculateSafetyScore = (actionType, stabilityImpact) => {
  switch (actionType) {
    case 'ENHANCE_FLOW':
      return stabilityImpact * 1.1;
    case 'FORCE_TRANSITION':
      return stabilityImpact * 0.4;
    case 'MODIFY_FIELD':
      return stabilityImpact * 0.8;
    case 'INITIATE_RECOVERY':
      return stabilityImpact * 1.4;
    default:
      return 0;
  }
};

/**
 * @param {ActionType} actionType
 * @param {number} stabilityImpact
 * @returns {number}
 */
const calculateProtectionScore = (actionType, stabilityImpact) => {
  switch (actionType) {
    case 'ENHANCE_FLOW':
      return stabilityImpact * 0.7;
    case 'FORCE_TRANSITION':
      return stabilityImpact * 0.3;
    case 'MODIFY_FIELD':
      return stabilityImpact * 0.6;
    case 'INITIATE_RECOVERY':
      return stabilityImpact * 0.8;
    default:
      return 0;
  }
};

/**
 * @param {ActionType} actionType
 * @param {number} coherenceImpact
 * @returns {number}
 */
const calculateCoherenceScore = (actionType, coherenceImpact) => {
  switch (actionType) {
    case 'ENHANCE_FLOW':
      return coherenceImpact * 0.4;
    case 'FORCE_TRANSITION':
      return coherenceImpact * 0.3;
    case 'MODIFY_FIELD':
      return coherenceImpact * 0.5;
    case 'INITIATE_RECOVERY':
      return coherenceImpact * 0.6;
    default:
      return 0;
  }
};

/**
 * @param {ActionType} actionType
 * @param {number} resonanceImpact
 * @returns {number}
 */
const calculateResonanceScore = (actionType, resonanceImpact) => {
  switch (actionType) {
    case 'ENHANCE_FLOW':
      return resonanceImpact * 0.6;
    case 'FORCE_TRANSITION':
      return resonanceImpact * 0.4;
    case 'MODIFY_FIELD':
      return resonanceImpact * 1.1;
    case 'INITIATE_RECOVERY':
      return resonanceImpact * 0.7;
    default:
      return 0;
  }
}; 