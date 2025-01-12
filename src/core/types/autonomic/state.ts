import { FlowState, Protection, Resonance } from '../base';
import { Pattern, PatternState } from '../patterns/types';
import { Observable } from 'rxjs';

export enum DevelopmentPhase {
  CONFIGURATION = 'CONFIGURATION',
  HEALING = 'HEALING',
  OPTIMIZATION = 'OPTIMIZATION',
  PROTECTION = 'PROTECTION'
}

export interface FlowMetrics {
  velocity: number;
  focus: number;
  energy: number;
  coherence: number;
  resonance: number;
}

export interface Flow {
  metrics: FlowMetrics;
  state: FlowState;
  timestamp: number;
}

export interface Energy {
  level: number;
  capacity: number;
  current: number;
  timestamp: number;
}

export interface Context {
  depth: number;
  metrics: FlowMetrics;
  protection: Protection;
  timestamp: number;
}

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

export interface AutonomicDevelopmentHook {
  state: AutonomicState;
  patterns: Pattern[];
}
