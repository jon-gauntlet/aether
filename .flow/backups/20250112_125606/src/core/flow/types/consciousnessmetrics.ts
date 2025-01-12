import { FlowState } from './base';
import { Field } from './base';

export interface ConsciousnessMetrics {
  clarity: number;
  depth: number;
  coherence: number;
  integration: number;
  flexibility: number;
}

export interface FlowSpace {
  dimensions: number;
  capacity: number;
  utilization: number;
  stability: number;
  fields: Field[];
  boundaries: Array<{
    dimension: number;
    threshold: number;
  }>;
}

export interface ConsciousnessState {
  currentState: FlowState;
  fields: Field[];
  flowSpace: FlowSpace;
  lastTransition: Date;
  stateHistory: Array<{
    timestamp: Date;
    state: FlowState;
    duration: number;
  }>;
  metrics: ConsciousnessMetrics;
} 