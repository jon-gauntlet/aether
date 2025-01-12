import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';

export enum ActionType {
  ENHANCE_FLOW = 'ENHANCE_FLOW',
  FORCE_TRANSITION = 'FORCE_TRANSITION',
  MODIFY_FIELD = 'MODIFY_FIELD',
  INITIATE_RECOVERY = 'INITIATE_RECOVERY'
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  safetyScore: number;
  protectionScore: number;
  coherenceScore: number;
  resonanceScore: number;
}

interface ValidationAction {
  type: ActionType;
  field: Field;
  consciousness: ConsciousnessState;
}

const calculateSafetyScore = (consciousness: ConsciousnessState): number => {
  const { stability } = consciousness.flowSpace;
  const { clarity, integration } = consciousness.metrics;
  return (stability * clarity * integration) ** (1/3);
};

const calculateProtectionScore = (field: Field): number => {
  const { shields, resilience, adaptability } = field.protection;
  return (shields * resilience * adaptability) ** (1/3);
};

const calculateCoherenceScore = (consciousness: ConsciousnessState): number => {
  const { coherence, depth, flexibility } = consciousness.metrics;
  return (coherence * depth * flexibility) ** (1/3);
};

const calculateResonanceScore = (field: Field): number => {
  const { amplitude, harmonics } = field.resonance;
  const harmonicStrength = harmonics.reduce((sum, h) => sum + h, 0) / harmonics.length;
  return (amplitude * harmonicStrength * field.strength) ** (1/3);
};

export const validateAutonomicAction = (action: ValidationAction): ValidationResult => {
  const { type, field, consciousness } = action;

  const safetyScore = calculateSafetyScore(consciousness);
  const protectionScore = calculateProtectionScore(field);
  const coherenceScore = calculateCoherenceScore(consciousness);
  const resonanceScore = calculateResonanceScore(field);

  let confidence = 0;
  let isValid = false;

  switch (type) {
    case ActionType.ENHANCE_FLOW:
      confidence = (safetyScore * coherenceScore * resonanceScore) ** (1/3);
      isValid = confidence > 0.7 && safetyScore > 0.6 && coherenceScore > 0.6;
      break;

    case ActionType.FORCE_TRANSITION:
      confidence = safetyScore * protectionScore;
      isValid = confidence > 0.8 && safetyScore > 0.7;
      break;

    case ActionType.MODIFY_FIELD:
      confidence = (protectionScore * resonanceScore * coherenceScore) ** (1/3);
      isValid = confidence > 0.7 && protectionScore > 0.6;
      break;

    case ActionType.INITIATE_RECOVERY:
      confidence = 0.8; // Recovery is always relatively safe
      isValid = true;
      break;

    default:
      confidence = 0;
      isValid = false;
  }

  return {
    isValid,
    confidence,
    safetyScore,
    protectionScore,
    coherenceScore,
    resonanceScore
  };
}; 