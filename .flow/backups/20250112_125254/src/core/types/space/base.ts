import type { Connection } from './structure';

export interface FlowMetrics {
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
}

export interface FlowState {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
}

export interface NaturalFlow {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
}

export type NaturalFlowType = 'linear' | 'cyclical' | 'spiral';

export interface Field {
  id: string;
  name: string;
  type: string;
  metrics: {
    energy: number;
    flow: number;
    coherence: number;
  };
}

export interface Wave {
  id: string;
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Resonance {
  id: string;
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Protection {
  id: string;
  level: number;
  type: string;
  strength: number;
}

export interface FlowSpace {
  id: string;
  velocity: number;
  direction: number;
  intensity: number;
}

export interface EnergyState {
  current: number;
  capacity: number;
  flow: number;
}

export interface ConsciousnessState {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
}

export interface SystemMeta {
  version: string;
  timestamp: number;
  metrics: FlowMetrics;
}

export const isProtected = (state: FlowState): boolean => state.metrics.coherence > 0.8;
export const isCoherent = (state: FlowState): boolean => state.metrics.harmony > 0.7;
export const isFlowing = (state: FlowState): boolean => state.metrics.presence > 0.6; 