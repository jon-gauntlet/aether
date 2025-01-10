import { Field, FlowState } from '../flow';
import { ConsciousnessState } from '../consciousness';

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

export interface PatternConditions {
  flowState?: FlowState;
  minFieldStrength?: number;
  minResonance?: number;
  maxResistance?: number;
  [key: string]: any;
}

export interface Pattern {
  id: string;
  name: string;
  conditions: PatternConditions;
  weight: number;
  activations: number;
}

export interface PatternMatch {
  pattern: Pattern;
  confidence: number;
  matchedConditions: string[];
}

export interface AutonomicAction {
  type: ActionType;
  field: Field;
  consciousness: ConsciousnessState;
}

export interface AutonomicMetrics {
  autonomyScore: number;
  patternStrength: number;
  adaptability: number;
  stability: number;
} 