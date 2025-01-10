import { Observable } from 'rxjs';

export interface FlowMetrics {
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
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

export const createDefaultField = (): Field => ({
  center: { x: 0, y: 0, z: 0 },
  radius: 1,
  strength: 1,
  waves: []
});

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
  resilience: number;
  adaptability: number;
  field?: Field;
}

export interface Connection {
  id?: string;
  from: string;
  to: string;
  sourceId?: string;
  targetId?: string;
  strength: number;
  type: string;
}

export interface FlowState extends FlowMetrics {
  // No additional properties, just the core metrics
}

export interface NaturalFlow extends FlowState {
  observeDepth(): Observable<number>;
  observeEnergy(): Observable<number>;
  observeFocus(): Observable<number>;
  observeResonance(): Observable<number>;
} 