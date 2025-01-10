import { Observable } from 'rxjs';

export interface FlowMetrics {
  depth: number;
  harmony: number;
  energy: number;
  presence: number;
  resonance: number;
  coherence: number;
  rhythm: number;
}

export type NaturalFlowType = 'natural' | 'guided' | 'resonant';

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
  level: number;
  strength: number;
  resilience: number;
  adaptability: number;
  field: Field;
}

export interface NaturalFlow {
  type: NaturalFlowType;
  metrics: FlowMetrics;
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
  timestamp: number;
} 