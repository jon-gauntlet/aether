import { ActionType } from '../types/constants';

export interface ValidationResult {
  isValid: boolean;
  safetyScore: number;
  protectionScore: number;
  coherenceScore: number;
  resonanceScore: number;
}

export interface ValidationState {
  id: string;
  currentState: string;
  metrics: {
    stability: number;
    coherence: number;
    resonance: number;
  };
}

export interface ValidationHistory {
  id: string;
  stateHistory: string[];
  metrics: {
    stability: number;
    coherence: number;
    resonance: number;
  };
}

/**
 * Validates autonomic actions based on current state and history
 */
export const validateAutonomicAction = (
  actionType: ActionType,
  state: ValidationState,
  history: ValidationHistory
): ValidationResult => {
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

  return {
    isValid: safetyScore > 0.5 && protectionScore > 0.3,
    safetyScore,
    protectionScore,
    coherenceScore,
    resonanceScore
  };
};

const calculateSafetyScore = (actionType: ActionType, stabilityImpact: number): number => {
  switch (actionType) {
    case 'ENHANCE_FLOW':
      return stabilityImpact * 0.8;
    case 'FORCE_TRANSITION':
      return stabilityImpact * 0.4;
    case 'MODIFY_FIELD':
      return stabilityImpact * 0.6;
    case 'INITIATE_RECOVERY':
      return stabilityImpact * 0.9;
    default:
      return 0;
  }
};

const calculateProtectionScore = (actionType: ActionType, stabilityImpact: number): number => {
  switch (actionType) {
    case 'ENHANCE_FLOW':
      return stabilityImpact * 0.7;
    case 'FORCE_TRANSITION':
      return stabilityImpact * 0.3;
    case 'MODIFY_FIELD':
      return stabilityImpact * 0.4;
    case 'INITIATE_RECOVERY':
      return stabilityImpact * 0.8;
    default:
      return 0;
  }
};

const calculateCoherenceScore = (actionType: ActionType, coherenceImpact: number): number => {
  switch (actionType) {
    case 'ENHANCE_FLOW':
      return coherenceImpact * 0.4;
    case 'FORCE_TRANSITION':
      return coherenceImpact * 0.3;
    case 'MODIFY_FIELD':
      return coherenceImpact * 0.6;
    case 'INITIATE_RECOVERY':
      return coherenceImpact * 0.7;
    default:
      return 0;
  }
};

const calculateResonanceScore = (actionType: ActionType, resonanceImpact: number): number => {
  switch (actionType) {
    case 'ENHANCE_FLOW':
      return resonanceImpact * 0.7;
    case 'FORCE_TRANSITION':
      return resonanceImpact * 0.4;
    case 'MODIFY_FIELD':
      return resonanceImpact * 0.9;
    case 'INITIATE_RECOVERY':
      return resonanceImpact * 0.8;
    default:
      return 0;
  }
}; 