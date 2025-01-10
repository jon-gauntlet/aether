import { Observable } from 'rxjs';

export enum FlowType {
  NATURAL = 'natural',
  GUIDED = 'guided',
  PROTECTED = 'protected',
  RESONANT = 'resonant'
}

export type PresenceType = 'neutral' | 'active' | 'deep' | 'protected';

export interface FlowMetrics {
  focus: number;
  presence: number;
  coherence: number;
  sustainability: number;
  depth: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  intensity: number;
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

export interface FlowState {
  id: string;
  type: FlowType;
  metrics: FlowMetrics;
  timestamp: number;
}

export interface Flow {
  id: string;
  state: FlowState;
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
}