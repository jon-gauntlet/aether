import { Field, FlowState, Resonance } from '../base';

export interface ConsciousnessState {
  currentState: FlowState;
  fields: Field[];
  flowSpace: {
    dimensions: number;
    capacity: number;
    utilization: number;
    stability: number;
    fields: Field[];
    boundaries: any[];
  };
  lastTransition: number;
  stateHistory: FlowState[];
  metrics: {
    clarity: number;
    depth: number;
    coherence: number;
    integration: number;
    flexibility: number;
  };
}

export interface Connection {
  source: string;
  target: string;
  strength: number;
  type: string;
}

export type { Field, Resonance };
