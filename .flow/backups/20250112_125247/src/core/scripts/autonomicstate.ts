import { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase } from './base';
import { Observable } from 'rxjs';

export interface AutonomicState {
  id: string;
  mode: 'active' | 'protective' | 'passive';
  level: number;
  metrics: FlowMetrics;
  protection: Protection;
  patterns: Pattern[];
  timestamp: number;
}

export interface AutonomicMetrics extends FlowMetrics {
  confidence: number;
  pattern_resonance: number;
  flow_protection: number;
  mode: 'active' | 'protective' | 'passive';
}

export interface AutonomicPattern extends Pattern {
  confidence: number;
  pattern_resonance: number;
  flow_protection: number;
  mode: 'active' | 'protective' | 'passive';
  developmentPhase: DevelopmentPhase;
}

export interface AutonomicValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metrics: AutonomicMetrics;
}

export interface AutonomicTransition {
  from: AutonomicState;
  to: AutonomicState;
  duration: number;
  quality: number;
  efficiency: number;
}

export interface AutonomicProtection extends Protection {
  confidence: number;
  pattern_resonance: number;
  flow_protection: number;
  mode: 'active' | 'protective' | 'passive';
}

export interface AutonomicAnalytics {
  confidence: number;
  pattern_resonance: number;
  flow_protection: number;
  mode: 'active' | 'protective' | 'passive';
  patterns: AutonomicPattern[];
  transitions: AutonomicTransition[];
}

export interface AutonomicCycle {
  phase: string;
  duration: number;
  intensity: number;
  recovery: number;
  patterns: AutonomicPattern[];
}

export interface AutonomicOptimization {
  target: AutonomicState;
  current: AutonomicState;
  efficiency: number;
  suggestions: string[];
  patterns: AutonomicPattern[];
}

export interface AutonomicSystem {
  state$: Observable<AutonomicState>;
  validateState(state: AutonomicState): Promise<AutonomicValidation>;
  predictState(context: string[]): Promise<AutonomicState>;
  getMetrics(): AutonomicMetrics;
}

export type { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase }; 