import { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase } from './base';
import { Observable } from 'rxjs';

export interface ContextState {
  id: string;
  type: 'focus' | 'background' | 'system';
  level: number;
  metrics: FlowMetrics;
  protection: Protection;
  patterns: Pattern[];
  timestamp: number;
}

export interface ContextMetrics extends FlowMetrics {
  depth: number;
  breadth: number;
  relevance: number;
  persistence: number;
}

export interface ContextPattern extends Pattern {
  depth: number;
  breadth: number;
  relevance: number;
  persistence: number;
  developmentPhase: DevelopmentPhase;
}

export interface ContextValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metrics: ContextMetrics;
}

export interface ContextTransition {
  from: ContextState;
  to: ContextState;
  duration: number;
  quality: number;
  efficiency: number;
}

export interface ContextProtection extends Protection {
  depth: number;
  breadth: number;
  relevance: number;
  persistence: number;
}

export interface ContextAnalytics {
  depth: number;
  breadth: number;
  relevance: number;
  persistence: number;
  patterns: ContextPattern[];
  transitions: ContextTransition[];
}

export interface ContextCycle {
  phase: string;
  duration: number;
  intensity: number;
  recovery: number;
  patterns: ContextPattern[];
}

export interface ContextOptimization {
  target: ContextState;
  current: ContextState;
  efficiency: number;
  suggestions: string[];
  patterns: ContextPattern[];
}

export interface ContextSystem {
  state$: Observable<ContextState>;
  validateContext(context: ContextState): Promise<ContextValidation>;
  predictContext(context: string[]): Promise<ContextState>;
  getMetrics(): ContextMetrics;
}

export type { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase }; 