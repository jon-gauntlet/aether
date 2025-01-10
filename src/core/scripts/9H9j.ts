import {
  Presence,
  Harmony,
  Energy,
  Depth,
  FlowType,
  ConnectionType,
  ConsciousnessType,
  SpaceType
} from './order';

// Base interfaces
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

export interface Connection {
  from: string;
  to: string;
  type: ConnectionType;
  strength: number;
}

// Core state interfaces
export interface NaturalFlow {
  presence: Presence;
  harmony: Harmony;
  rhythm: number;
  resonance: number;
  coherence: number;
}

export interface EnergyState {
  level: Energy;
  quality: number;
  stability: number;
  protection: number;
}

// Space interfaces
export interface FlowSpace {
  id: string;
  type: FlowType;
  flow: NaturalFlow;
  depth: Depth;
  connections: Connection[];
}

export interface MindSpace {
  id: string;
  type: SpaceType;
  resonance: Resonance;
  depth: Depth;
  connections: Connection[];
}

// System interfaces
export interface Resonance {
  frequency: number;
  amplitude: number;
  harmony: Harmony;
  field: Field;
  essence: number;
}

export interface Protection {
  level: number;
  strength: number;
  resilience: number;
  adaptability: number;
  field: Field;
}

// Root state interface
export interface ConsciousnessState {
  id: string;
  type: ConsciousnessType;
  flow: NaturalFlow;
  energy: EnergyState;
  depth: Depth;
  spaces: FlowSpace[];
  connections: Connection[];
}

// Export with unique names
export type {
  Field as StructureField,
  Connection as StructureConnection,
  NaturalFlow as StructureNaturalFlow,
  EnergyState as StructureEnergyState,
  FlowSpace as StructureFlowSpace,
  MindSpace as StructureMindSpace,
  ConsciousnessState as StructureConsciousnessState
}; 