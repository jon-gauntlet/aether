import { Observable } from 'rxjs';
import { FlowMetrics, AdvancedFlowMetrics } from './metrics';
import { Field, Resonance } from './core';

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
  observeResonance(): Observable<number>;
}

// Extended flow with additional capabilities
export interface Flow extends NaturalFlow, AdvancedFlowMetrics {
  // Flow metrics
  metrics: {
    depth: number;
    harmony: number;
    energy: number;
  };
}

export interface ConsciousnessState {
  id: string;
  type: string;
  space: {
    id: string;
    resonance: Resonance;
    depth: number;
    connections: string[];
  };
  spaces: any[];
  connections: string[];
  resonance: Resonance;
  depth: number;
  protection: {
    strength: number;
    level: number;
    field: Field;
    resilience: number;
    adaptability: number;
  };
  energy: {
    level: number;
    quality: number;
    stability: number;
    protection: number;
  };
  flow: Flow;
  coherence: number;
}
