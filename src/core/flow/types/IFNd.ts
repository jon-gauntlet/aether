import { FlowType, PresenceType } from './flow';

export interface ContextMetrics {
  depth: number;
  presence: number;
  coherence: number;
  stability: number;
}

export interface ContextProtection {
  level: number;
  type: 'standard' | 'enhanced' | 'autonomous';
}

export interface ContextState {
  id: string;
  type: string;
  depth: number;
  presence: PresenceType;
  flow: FlowType;
  metrics: ContextMetrics;
  protection: ContextProtection;
  timestamp: number;
}

export interface ContextTransition {
  from: string;
  to: string;
  trigger: string;
  timestamp: number;
}

export interface ContextPattern {
  id: string;
  type: string;
  metrics: ContextMetrics;
  transitions: ContextTransition[];
}

// Development-specific types
export interface DevelopmentContext extends ContextState {
  type: 'development';
  pattern: ContextPattern;
  validationLevel: number;
  autonomicLevel: number;
} 