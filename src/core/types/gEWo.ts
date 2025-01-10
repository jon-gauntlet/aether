import { Field, FlowState } from './base';

export interface ConsciousnessState {
  currentState: FlowState;
  fields: Field[];
  activeField?: Field;
  flowSpace: FlowSpace;
  lastTransition: number;
  stateHistory: FlowState[];
  metrics: ConsciousnessMetrics;
}

export interface FlowSpace {
  dimensions: number;
  capacity: number;
  utilization: number;
  stability: number;
  fields: Field[];
  boundaries: Boundary[];
}

export interface Boundary {
  type: BoundaryType;
  strength: number;
  permeability: number;
  recovery: number;
}

export interface ConsciousnessMetrics {
  clarity: number;
  depth: number;
  coherence: number;
  integration: number;
  flexibility: number;
}

export enum BoundaryType {
  PERMEABLE = 'PERMEABLE',
  RIGID = 'RIGID',
  ADAPTIVE = 'ADAPTIVE',
  SELECTIVE = 'SELECTIVE'
}

export const createDefaultConsciousnessState = (): ConsciousnessState => ({
  currentState: FlowState.FOCUS,
  fields: [],
  flowSpace: {
    dimensions: 3,
    capacity: 100,
    utilization: 0,
    stability: 1.0,
    fields: [],
    boundaries: [
      {
        type: BoundaryType.ADAPTIVE,
        strength: 1.0,
        permeability: 0.5,
        recovery: 1.0
      }
    ]
  },
  lastTransition: Date.now(),
  stateHistory: [],
  metrics: {
    clarity: 1.0,
    depth: 1.0,
    coherence: 1.0,
    integration: 1.0,
    flexibility: 1.0
  }
}); 