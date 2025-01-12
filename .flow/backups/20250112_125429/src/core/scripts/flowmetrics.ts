import { Observable } from 'rxjs';
import { FlowMetrics, NaturalFlow } from './base';
import { Connection } from './consciousness';
import { PresenceType, Stream } from './stream';

export type FlowType = 'natural' | 'guided' | 'resonant' | 'protected';

export interface FlowMetrics {
  focus: number;
  presence: number;
  coherence: number;
  sustainability: number;
  depth: number;
  harmony: number;
}

export interface FlowContext {
  type: string;
  depth: number;
  duration: number;
}

export interface FlowProtection {
  level: number;
  type: string;
  strength: number;
}

export interface Flow {
  state: FlowType;
  context: FlowContext;
  metrics: FlowMetrics;
  protection: FlowProtection;
}

export interface FlowTransition {
  from: FlowType;
  to: FlowType;
  trigger: string;
  quality: number;
}

export interface FlowEngine {
  id: string;
  measure(): Promise<Flow>;
  transition(to: FlowType, trigger: string): Promise<FlowTransition>;
  setMode(mode: FlowType): void;
  deepen(): Promise<void>;
  protect(): Promise<void>;
  observe(): Observable<Flow>;
}