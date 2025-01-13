import { Field } from '../base';
import { ConsciousnessState } from '../consciousness/consciousness';

export enum ActionType {
  FORCE_TRANSITION = 'FORCE_TRANSITION',
  INITIATE_RECOVERY = 'INITIATE_RECOVERY',
  PATTERN_RECOGNITION = 'PATTERN_RECOGNITION',
  STATE_EVOLUTION = 'STATE_EVOLUTION'
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AutonomicAction {
  type: ActionType;
  field: Field;
  consciousness: ConsciousnessState;
}

export const validateAutonomicAction = (action: AutonomicAction): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate field
  if (!action.field.protection || action.field.protection.stability < 0.5) {
    errors.push('Field stability too low for autonomic action');
  }

  // Validate consciousness
  if (!action.consciousness.flowSpace || action.consciousness.flowSpace.coherence < 0.5) {
    errors.push('Consciousness coherence too low for autonomic action');
  }

  // Validate action type
  if (!Object.values(ActionType).includes(action.type)) {
    errors.push('Invalid action type');
  }

  // Add warnings for borderline conditions
  if (action.field.protection.stability < 0.7) {
    warnings.push('Field stability approaching minimum threshold');
  }
  if (action.consciousness.flowSpace.coherence < 0.7) {
    warnings.push('Consciousness coherence approaching minimum threshold');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}; 