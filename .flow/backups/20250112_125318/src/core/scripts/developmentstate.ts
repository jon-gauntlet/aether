import { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase } from './base';
import { Observable } from 'rxjs';

export interface DevelopmentState {
  id: string;
  phase: DevelopmentPhase;
  level: number;
  metrics: FlowMetrics;
  protection: Protection;
  patterns: Pattern[];
  timestamp: number;
}

export interface DevelopmentMetrics extends FlowMetrics {
  growth: number;
  adaptation: number;
  evolution: number;
  stability: number;
}

export interface DevelopmentPattern extends Omit<Pattern, 'evolution'> {
  growth: number;
  adaptation: number;
  evolution: {
    stage: number;
    history: string[];
    lastEvolved: string;
    entropyLevel: number;
    metrics?: {
      adaptability: number;
      resilience: number;
      coherence: number;
      stability: number;
    };
  };
  stability: number;
  developmentPhase: DevelopmentPhase;
}

export interface DevelopmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metrics: DevelopmentMetrics;
}

export interface DevelopmentTransition {
  from: DevelopmentState;
  to: DevelopmentState;
  duration: number;
  quality: number;
  efficiency: number;
}

export interface DevelopmentProtection extends Protection {
  growth: number;
  adaptation: number;
  evolution: number;
  stability: number;
}

export interface DevelopmentAnalytics {
  growth: number;
  adaptation: number;
  evolution: number;
  stability: number;
  patterns: DevelopmentPattern[];
  transitions: DevelopmentTransition[];
}

export interface DevelopmentCycle {
  phase: string;
  duration: number;
  intensity: number;
  recovery: number;
  patterns: DevelopmentPattern[];
}

export interface DevelopmentOptimization {
  target: DevelopmentState;
  current: DevelopmentState;
  efficiency: number;
  suggestions: string[];
  patterns: DevelopmentPattern[];
}

export interface DevelopmentSystem {
  state$: Observable<DevelopmentState>;
  validateState(state: DevelopmentState): Promise<DevelopmentValidation>;
  predictState(context: string[]): Promise<DevelopmentState>;
  getMetrics(): DevelopmentMetrics;
}

export type { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase }; 