import { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase } from './base';
import { Observable } from 'rxjs';

export interface FlowSystem {
  state$: Observable<FlowState>;
  updateState(state: Partial<FlowState>): void;
  validateState(state: Partial<FlowState>): Promise<boolean>;
  predictState(context: string[]): Promise<FlowState>;
}

export interface FlowContext {
  task: string;
  goal: string;
  constraints: string[];
  resources: string[];
}

export interface FlowPattern {
  id: string;
  type: string;
  state: FlowState;
  context: FlowContext;
  metrics: FlowMetrics;
  protection: Protection;
  patterns: Pattern[];
  developmentPhase: DevelopmentPhase;
}

export interface FlowValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metrics: FlowMetrics;
}

export interface FlowTransitionResult {
  success: boolean;
  from: FlowState;
  to: FlowState;
  duration: number;
  quality: number;
}

export interface FlowProtection {
  level: number;
  type: string;
  strength: number;
  resilience: number;
  adaptability: number;
  patterns: Pattern[];
}

export interface FlowAnalytics {
  quality: number;
  stability: number;
  coherence: number;
  patterns: Pattern[];
  transitions: FlowTransitionResult[];
}