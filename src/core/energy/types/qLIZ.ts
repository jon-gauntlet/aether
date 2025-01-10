import { Observable } from 'rxjs';

// Core consciousness types
export interface NaturalFlow {
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
  
  // Observable methods
  observeDepth(): Observable<number>;
  observeEnergy(): Observable<number>;
  observeFocus(): Observable<number>;
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
  space: MindSpace;
  spaces: FlowSpace[];
  connections: Connection[];
  resonance: Resonance;
  depth: number;
  protection: Protection;
  energy: EnergyState;
  flow: NaturalFlow;
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
  divine: number;
}

export interface Protection {
  strength: number;
  level: number;
  field: Field;
  resilience: number;
  adaptability: number;
}

export interface MindSpace {
  id: string;
  resonance: Resonance;
  depth: number;
  connections: Connection[];
}

// Type Guards
export const isProtected = (state: ConsciousnessState): boolean => 
  state.protection.strength >= 0.7;

export const isCoherent = (state: ConsciousnessState): boolean =>
  state.resonance.harmony >= 0.7;

export const isFlowing = (state: ConsciousnessState): boolean =>
  state.resonance.harmony >= 0.7;

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

export type Depth = 'surface' | 'shallow' | 'deep' | 'profound'; 

export interface SystemMeta {
  baseFrequency: number;
  baseAmplitude: number;
  baseHarmony: number;
  baseProtection: {
    strength: number;
    resilience: number;
    adaptability: number;
  };
}

export interface Flow {
  pace: number;
  adaptability: number;
  emergence: number;
  balance: number;
} 