import { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase } from './base';
import { Observable } from 'rxjs';

export interface Stream {
  id: string;
  type: 'thought' | 'energy' | 'presence';
  metrics: FlowMetrics;
  protection: Protection;
  patterns: Pattern[];
  timestamp: number;
}

export interface StreamMetrics extends FlowMetrics {
  velocity: number;
  direction: number;
  coherence: number;
  resonance: number;
}

export interface StreamPattern extends Pattern {
  velocity: number;
  direction: number;
  coherence: number;
  resonance: number;
  developmentPhase: DevelopmentPhase;
}

export interface StreamValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metrics: StreamMetrics;
}

export interface StreamTransition {
  from: Stream;
  to: Stream;
  duration: number;
  quality: number;
  efficiency: number;
}

export interface StreamProtection extends Protection {
  velocity: number;
  direction: number;
  coherence: number;
  resonance: number;
}

export interface StreamAnalytics {
  velocity: number;
  direction: number;
  coherence: number;
  resonance: number;
  patterns: StreamPattern[];
  transitions: StreamTransition[];
}

export interface StreamCycle {
  phase: string;
  duration: number;
  intensity: number;
  recovery: number;
  patterns: StreamPattern[];
}

export interface StreamOptimization {
  target: Stream;
  current: Stream;
  efficiency: number;
  suggestions: string[];
  patterns: StreamPattern[];
}

export interface StreamSystem {
  state$: Observable<Stream>;
  validateStream(stream: Stream): Promise<StreamValidation>;
  predictStream(context: string[]): Promise<Stream>;
  getMetrics(): StreamMetrics;
}

export type { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase };