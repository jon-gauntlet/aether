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

export const createDefaultConsciousnessState = (): ConsciousnessState => ({
  currentState: 'RESTING',
  fields: [],
  flowSpace: {
    dimensions: 3,
    capacity: 100,
    utilization: 0,
    stability: 1,
    fields: [],
    boundaries: []
  },
  lastTransition: Date.now(),
  stateHistory: [],
  metrics: {
    clarity: 0.8,
    depth: 0.7,
    coherence: 0.9,
    integration: 0.85,
    flexibility: 0.75
  }
});

export type { Field, Resonance };
