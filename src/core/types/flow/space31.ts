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
  from: string;
  to: string;
  type: 'flow' | 'presence' | 'resonance';
  strength: number;
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
  type: 'individual' | 'collective';
  flow: NaturalFlow;
  energy: EnergyState;
  depth: number;
  spaces: FlowSpace[];
  connections: Connection[];
}

export interface Field {
  center: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  strength: number;
}

export interface Resonance {
  frequency: number;
  amplitude: number;
  harmony: number;
  field: Field;
  divine: number;
}

export interface Protection {
  level: number;
  strength: number;
  field: Field;
}

export interface MindSpace {
  id: string;
  type: 'thought' | 'feeling' | 'intuition';
  resonance: Resonance;
  depth: number;
  connections: Connection[];
