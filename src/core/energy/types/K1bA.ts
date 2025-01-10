import { Observable } from 'rxjs';

// Core data types - pure data structures
export interface FlowMetrics {
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
}

// Pure data state for serialization and updates
export interface FlowState extends FlowMetrics {
  // No additional properties, just the core metrics
}

// Active type with observable methods
export interface NaturalFlow extends FlowState {
  // Observable methods
  observeDepth(): Observable<number>;
  observeEnergy(): Observable<number>;
  observeFocus(): Observable<number>;
}

// Data structure for space flow state
export interface FlowSpaceState {
  id: string;
  type: 'meditation' | 'focus' | 'flow';
  flow: FlowState;  // Note: Changed from NaturalFlow to FlowState
  depth: number;
  connections: Connection[];
}

// Active type for space flow
export interface FlowSpace extends Omit<FlowSpaceState, 'flow'> {
  flow: NaturalFlow;
}

export interface Stream {
  id: string;
  presence: number;    // Inner presence
  harmony: number;     // Inner harmony 
  near: string[];      // Connected streams
  signs: any[];        // Context
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
  essence: number;
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

export const isMindSpace = (space: any): space is MindSpace => {
  return (
    typeof space === 'object' &&
    typeof space.id === 'string' &&
    typeof space.depth === 'number' &&
    Array.isArray(space.connections) &&
    space.connections.every(isConnection) &&
    isResonance(space.resonance)
  );
};

export const isResonance = (resonance: any): resonance is Resonance => {
  return (
    typeof resonance === 'object' &&
    typeof resonance.frequency === 'number' &&
    typeof resonance.amplitude === 'number' &&
    typeof resonance.harmony === 'number' &&
    typeof resonance.essence === 'number' &&
    isField(resonance.field)
  );
};

export const isField = (field: any): field is Field => {
  return (
    typeof field === 'object' &&
    typeof field.center === 'object' &&
    typeof field.center.x === 'number' &&
    typeof field.center.y === 'number' &&
    typeof field.center.z === 'number' &&
    typeof field.radius === 'number' &&
    typeof field.strength === 'number' &&
    Array.isArray(field.waves) &&
    field.waves.every(isWave)
  );
};

export const isWave = (wave: any): wave is Wave => {
  return (
    typeof wave === 'object' &&
    typeof wave.frequency === 'number' &&
    typeof wave.amplitude === 'number' &&
    typeof wave.phase === 'number'
  );
};

export const isConnection = (connection: any): connection is Connection => {
  return (
    typeof connection === 'object' &&
    typeof connection.from === 'string' &&
    typeof connection.to === 'string' &&
    typeof connection.strength === 'number' &&
    (connection.type === 'flow' ||
     connection.type === 'presence' ||
     connection.type === 'resonance')
  );
};

export const isStream = (stream: any): stream is Stream => {
  return (
    typeof stream === 'object' &&
    typeof stream.id === 'string' &&
    typeof stream.presence === 'number' &&
    typeof stream.harmony === 'number' &&
    Array.isArray(stream.near) &&
    stream.near.every((id: any) => typeof id === 'string') &&
    Array.isArray(stream.signs)
  );
};

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

export interface Flow extends FlowMetrics {
  // System-level flow properties
  pace: number;
  adaptability: number;
  emergence: number;
  balance: number;
} 