import { Field, FlowState, Protection } from '../types/base';

export type ActionType = 'flow' | 'protection' | 'resonance';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  context: {
    flowState: FlowState;
    protection: Protection;
    metrics: {
      stability: number;
      coherence: number;
      safety: number;
    };
  };
}

export function validateAutonomicAction(
  field: Field,
  actionType: ActionType,
  context: string[]
): ValidationResult {
  switch (actionType) {
    case 'flow':
      return validateFlow(field);
    case 'protection':
      return validateProtection(field);
    case 'resonance':
      return validateResonance(field);
    default:
      return {
        isValid: false,
        confidence: 0,
        context: {
          flowState: 'RESTING',
          protection: field.protection,
          metrics: {
            stability: 0,
            coherence: 0,
            safety: 0
          }
        }
      };
  }
}

function validateFlow(field: Field): ValidationResult {
  const stability = field.protection.stability;
  const energy = field.metrics.energy;
  const focus = field.metrics.focus;

  const isValid = stability > 0.7 && energy > 0.5 && focus > 0.6;
  const confidence = (stability + energy + focus) / 3;

  return {
    isValid,
    confidence,
    context: {
      flowState: isValid ? 'FLOW' : 'RESTING',
      protection: field.protection,
      metrics: {
        stability,
        coherence: field.resonance.coherence,
        safety: field.protection.integrity
      }
    }
  };
}

function validateProtection(field: Field): ValidationResult {
  const integrity = field.protection.integrity;
  const shields = field.protection.shields;
  const resilience = field.protection.resilience;

  const isValid = integrity > 0.8 && shields > 0.7 && resilience > 0.6;
  const confidence = (integrity + shields + resilience) / 3;

  return {
    isValid,
    confidence,
    context: {
      flowState: isValid ? 'PROTECTED' : 'RESTING',
      protection: field.protection,
      metrics: {
        stability: field.protection.stability,
        coherence: field.resonance.coherence,
        safety: integrity
      }
    }
  };
}

function validateResonance(field: Field): ValidationResult {
  const coherence = field.resonance.coherence;
  const harmony = field.resonance.harmony;
  const stability = field.protection.stability;

  const isValid = coherence > 0.7 && harmony > 0.6 && stability > 0.5;
  const confidence = (coherence + harmony + stability) / 3;

  return {
    isValid,
    confidence,
    context: {
      flowState: isValid ? 'FLOW' : 'RESTING',
      protection: field.protection,
      metrics: {
        stability,
        coherence,
        safety: field.protection.integrity
      }
    }
  };
} 