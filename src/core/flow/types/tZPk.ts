import { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase } from './base';
import { Observable } from 'rxjs';

export type FlowType = 'natural' | 'guided' | 'autonomous';
export type PresenceType = 'deep' | 'light' | 'surface';

export interface Flow {
  id: string;
  type: FlowType;
  metrics: FlowMetrics;
  protection: Protection;
  patterns: Pattern[];
  timestamp: number;
}

export interface FlowTransition {
  from: FlowState;
  to: FlowState;
  duration: number;
  quality: number;
  efficiency: number;
}

export interface FlowContext {
  id: string;
  type: FlowType;
  presence: PresenceType;
  metrics: FlowMetrics;
  protection: Protection;
  patterns: Pattern[];
  timestamp: number;
}

export interface FlowValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metrics: FlowMetrics;
}

export interface FlowEngine {
  state$: Observable<FlowState>;
  validateFlow(flow: Flow): Promise<FlowValidation>;
  predictFlow(context: FlowContext): Promise<FlowState>;
  getFlowMetrics(): FlowMetrics;
}

export interface FlowProtection extends Protection {
  efficiency: number;
  sustainability: number;
  recovery: number;
  balance: number;
}

export interface FlowAnalytics {
  efficiency: number;
  sustainability: number;
  recovery: number;
  balance: number;
  patterns: Pattern[];
  transitions: FlowTransition[];
}

export interface FlowCycle {
  phase: string;
  duration: number;
  intensity: number;
  recovery: number;
  patterns: Pattern[];
}

export interface FlowOptimization {
  target: FlowState;
  current: FlowState;
  efficiency: number;
  suggestions: string[];
  patterns: Pattern[];
}

export type { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase };