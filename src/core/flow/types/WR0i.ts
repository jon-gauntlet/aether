import { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase } from './base';
import { Observable } from 'rxjs';

export interface ConsciousnessState {
  id: string;
  mode: 'active' | 'passive' | 'protective';
  level: number;
  metrics: FlowMetrics;
  protection: Protection;
  patterns: Pattern[];
  timestamp: number;
}

export interface ConsciousnessMetrics extends FlowMetrics {
  clarity: number;
  presence: number;
  stability: number;
  integration: number;
}

export interface ConsciousnessPattern extends Pattern {
  clarity: number;
  presence: number;
  stability: number;
  integration: number;
  developmentPhase: DevelopmentPhase;
}

export interface ConsciousnessValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metrics: ConsciousnessMetrics;
}

export interface ConsciousnessTransition {
  from: ConsciousnessState;
  to: ConsciousnessState;
  duration: number;
  quality: number;
  efficiency: number;
}

export interface ConsciousnessProtection extends Protection {
  clarity: number;
  presence: number;
  stability: number;
  integration: number;
}

export interface ConsciousnessAnalytics {
  clarity: number;
  presence: number;
  stability: number;
  integration: number;
  patterns: ConsciousnessPattern[];
  transitions: ConsciousnessTransition[];
}

export interface ConsciousnessCycle {
  phase: string;
  duration: number;
  intensity: number;
  recovery: number;
  patterns: ConsciousnessPattern[];
}

export interface ConsciousnessOptimization {
  target: ConsciousnessState;
  current: ConsciousnessState;
  efficiency: number;
  suggestions: string[];
  patterns: ConsciousnessPattern[];
}

export interface ConsciousnessSystem {
  state$: Observable<ConsciousnessState>;
  validateState(state: ConsciousnessState): Promise<ConsciousnessValidation>;
  predictState(context: string[]): Promise<ConsciousnessState>;
  getMetrics(): ConsciousnessMetrics;
}

export type { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase };