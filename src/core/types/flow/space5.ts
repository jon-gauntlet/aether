// Core consciousness types
export interface NaturalFlow {
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
}

export interface EnergyState {
  level: number;
  quality: number;
  stability: number;
  protection: number;
}

export interface Connection {
  sourceId: string;
  targetId: string;
  strength: number;
  resonance: Resonance;
}

export interface FlowSpace {
  id: string;
  type: 'meditation' | 'focus' | 'flow';
  flow: NaturalFlow;
  depth: number;
  connections: Connection[];
}

export interface ConsciousnessState {
  id: string;
  space: MindSpace;
  resonance: Resonance;
  depth: number;
  protection: Protection;
}

export interface Field {
  center: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  strength: number;
  waves: Wave[];
}

export interface Wave {
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Resonance {
  frequency: number;
  amplitude: number;
  harmony: number;
  field: Field;
}

export interface Protection {
  strength: number;
  level: number;
  field: Field;
}

export interface MindSpace {
  id: string;
  resonance: Resonance;
  depth: number;
  connections: Connection[];
}

// Type Guards
export const isProtected = (state: ConsciousnessState): boolean => 
  state.energy.protection >= 0.7;

export const isCoherent = (state: ConsciousnessState): boolean =>
  state.flow.coherence >= 0.7;

export const isFlowing = (state: ConsciousnessState): boolean =>
  state.flow.resonance >= 0.7;

// Additional Types
export type ThoughtStream = {
  id: string;
  type: 'focus' | 'explore' | 'rest' | 'connect';
  state: ConsciousnessState;
};

export type ThoughtEvolution = {
  id: string;
  from: ConsciousnessState;
  to: ConsciousnessState;
  depth: number;
};

