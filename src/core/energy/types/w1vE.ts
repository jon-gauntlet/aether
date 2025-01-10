import { FlowMetrics as BaseFlowMetrics, BaseMetrics, Protection, FlowState as BaseFlowState } from './base';
import { Observable } from 'rxjs';

export type FlowType = 'natural' | 'guided' | 'resonant' | 'protected';
export type PresenceType = 'neutral' | 'active' | 'deep' | 'protected' | 'focused';

export interface FlowContext {
  depth: number;
  type: FlowType;
  presence: PresenceType;
  task?: string;
  goal?: string;
  constraints?: string[];
  resources?: string[];
}

export interface FlowProtection extends Protection {
  strength: number;
}

export type FlowMetrics = BaseFlowMetrics;
export type FlowState = BaseFlowState;

export interface Flow extends FlowState {
  type: FlowType;
  metrics: FlowMetrics;
  context: FlowContext;
  observeDepth(): Observable<number>;
  observeEnergy(): Observable<number>;
  observeFocus(): Observable<number>;
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