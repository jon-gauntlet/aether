import { ProtectionState } from '../protection/protection';
import { Pattern } from '../patterns/pattern';
import { Observable } from 'rxjs';
import { FlowMetrics } from './metrics';

export type FlowType = 'natural' | 'guided' | 'autonomous';
export type PresenceType = 'deep' | 'light' | 'surface';
export type FlowIntensity = 'low' | 'medium' | 'high' | 'peak';

export enum FlowStateType {
  FOCUS = 'FOCUS',
  FLOW = 'FLOW',
  HYPERFOCUS = 'HYPERFOCUS',
  RECOVERING = 'RECOVERING',
  EXHAUSTED = 'EXHAUSTED',
  DISTRACTED = 'DISTRACTED'
}

export interface FlowState {
  active: boolean;
  type: FlowStateType;
  intensity: FlowIntensity;
  duration: number;
  metrics: FlowMetrics;
  lastTransition: number;
  protected: boolean;
  quality: number;
}

// Development phase type
export enum DevelopmentPhase {
  Initial = 'initial',
  Learning = 'learning',
  Practicing = 'practicing',
  Mastering = 'mastering',
  Teaching = 'teaching',
  Evolving = 'evolving'
}

export interface Flow {
  id: string;
  type: FlowType;
  metrics: FlowMetrics;
  protection: ProtectionState;
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
  state: FlowState;
  protection: ProtectionState;
  transitions: FlowTransition[];
  metrics: FlowMetrics;
  patterns: Pattern[];
}

// Re-export for convenience
export type { FlowMetrics, ProtectionState };

