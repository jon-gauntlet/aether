import { NaturalFlow } from '../types';

export interface ConsciousnessState {
  id: string;
  type: 'individual' | 'collective';
  flow: NaturalFlow;
  depth: number;
  connections: Connection[];
  energy: number;
  spaces: FlowSpace[];
}

export interface Connection {
  from: string;
  to: string;
  type: 'presence' | 'resonance' | 'flow';
  strength: number;
}

export interface ThoughtStream {
  id: string;
  type: 'conscious' | 'subconscious' | 'divine';
  flow: NaturalFlow;
  resonance: Resonance;
  depth: Depth;
}

export interface ThoughtEvolution {
  id: string;
  streamId: string;
  type: 'growth' | 'purification' | 'illumination';
  intensity: number;
  timestamp: number;
}

export interface Resonance {
  frequency: number;
  amplitude: number;
  harmony: number;
  divine: number;
  field: Field;
}

export interface Field {
  center: Point3D;
  radius: number;
  strength: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Depth {
  level: number;
  stability: number;
  clarity: number;
}

export interface FlowSpace {
  id: string;
  type: 'personal' | 'shared' | 'sacred';
  flow: NaturalFlow;
  depth: number;
  connections: Connection[];
} 