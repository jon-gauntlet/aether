import { Observable } from 'rxjs';

export type FlowType = 'natural' | 'guided' | 'resonant' | 'protected';
export type PresenceType = 'neutral' | 'focused' | 'distracted' | 'deep';

export interface FlowMetrics {
  focus: number;
  presence: number;
  coherence: number;
  sustainability: number;
  depth: number;
  harmony: number;
}

export interface FlowContext {
  depth: number;
  type: FlowType;
  presence: PresenceType;
}

export interface FlowProtection {
  level: number;
  type: FlowType;
  strength: number;
}

export interface Flow {
  id: string;
  state: FlowType;
  metrics: FlowMetrics;
  context: FlowContext;
  protection: FlowProtection;
}

export interface FlowTransition {
  from: FlowType;
  to: FlowType;
  trigger: string;
  timestamp: number;
}

export interface FlowEngine {
  observe(): Observable<Flow>;
  measure(): Promise<Flow>;
  transition(to: FlowType, trigger: string): Promise<FlowTransition>;
  setMode(mode: FlowType): void;
  updatePresence(presence: PresenceType): void;
  protect(): Promise<void>;
  deepen(): Promise<void>;
