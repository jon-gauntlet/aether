import { FlowMetrics, BaseMetrics, Protection } from './base';
import { Observable } from 'rxjs';

export type FlowType = 'natural' | 'guided' | 'resonant';
export type PresenceType = 'neutral' | 'active' | 'deep' | 'protected';

export interface FlowState {
  id: string;
  type: FlowType;
  metrics: FlowMetrics;
  protection: Protection;
}

export interface FlowContext {
  depth: number;
  type: FlowType;
  presence: PresenceType;
}

export interface FlowProtection extends Protection {
  strength: number;
}

export interface Flow extends FlowState {
  type: FlowType;
  metrics: FlowMetrics & {
    presence: number;
    harmony: number;
    rhythm: number;
    resonance: number;
    coherence: number;
    depth: number;
    energy: number;
  };
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