import { Observable } from 'rxjs';

export interface FlowState extends FlowMetrics {
  metrics: FlowMetrics;
  observeDepth: () => Observable<number>;
  observeEnergy: () => Observable<number>;
  observeFocus: () => Observable<number>;
}

export interface FlowMetrics {
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
  depth: number;
  energy: number;
}

export interface NaturalFlow extends FlowState {
  // Additional properties specific to NaturalFlow
}

export interface Field {
  center: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  strength: number;
  waves: any[];
}

export interface Resonance {
  frequency: number;
  amplitude: number;
  harmony: number;
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

export interface FlowSpace {
  id: string;
  type: 'natural' | 'meditation';
  metrics: FlowMetrics;
  resonance: Resonance;
  depth: number;
  protection: Protection;
  connections: Connection[];
  flow: NaturalFlow;
  timestamp: number;
}

export interface Connection {
  id: string;
  type: string;
  strength: number;
  quality: number;
}

export interface ConsciousnessState {
  id: string;
  type: 'individual';
  space: FlowSpace;
  spaces: FlowSpace[];
  resonance: Resonance;
  depth: number;
  protection: Protection;
  energy: EnergyState;
  flow: NaturalFlow;
  coherence: number;
  timestamp: number;
}

export interface EnergyState {
  level: number;
  capacity: number;
  quality: number;
  stability: number;
  protection: number;
  resonance: Resonance;
  field: Field;
  flow: number;
  recovery: number;
  reserves: number;
  timestamp: number;
}