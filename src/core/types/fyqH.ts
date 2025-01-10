import { FlowState, FlowMetrics, Protection, Resonance, Pattern, DevelopmentPhase } from './base';
import { Observable } from 'rxjs';

export interface AutonomicState {
  id: string;
  type: string;
  flow: FlowState;
  energy: EnhancedEnergyState;
  context: ContextState;
  protection: Protection;
  resonance: Resonance;
  patterns: Pattern[];
  timestamp: number;
}

export interface EnhancedEnergyState {
  id: string;
  level: number;
  capacity: number;
  focusMultiplier: number;
  recoveryEfficiency: number;
  sustainedDuration: number;
  developmentPhase: DevelopmentPhase;
}

export interface ContextState {
  id: string;
  flow: FlowState;
  metrics: ContextMetrics;
  protection: Protection;
  timestamp: number;
}

export interface ContextMetrics extends FlowMetrics {
  stability: number;
  adaptability: number;
  resilience: number;
}

export interface AutonomicSystem {
  state$: Observable<AutonomicState>;
  updateState(state: Partial<AutonomicState>): void;
  validateState(state: Partial<AutonomicState>): Promise<boolean>;
  predictState(context: string[]): Promise<AutonomicState>;
}

export interface EnergySystem {
  state$: Observable<EnhancedEnergyState>;
  updateState(state: Partial<EnhancedEnergyState>): void;
  validateState(state: Partial<EnhancedEnergyState>): Promise<boolean>;
  predictState(context: string[]): Promise<EnhancedEnergyState>;
}

export interface TypeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ValidationPattern {
  context: string[];
  signature: string[];
  depth: number;
  strength: number;
  developmentPhase: DevelopmentPhase;
}

export interface AutonomicDevelopmentProps {
  autonomic: AutonomicSystem;
  energy: EnergySystem;
} 