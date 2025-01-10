import { Observable } from 'rxjs';
import type { Stream as FlowStream } from './stream';
import type { PresenceType } from './stream';

// Core metrics that all flow types share
export interface FlowMetrics {
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
}

// Extended metrics for advanced flow states
export interface AdvancedFlowMetrics extends FlowMetrics {
  pace: number;
  adaptability: number;
  emergence: number;
  balance: number;
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
  observeResonance(): Observable<number>;
}

// Extended flow with additional capabilities
export interface Flow extends NaturalFlow, AdvancedFlowMetrics {
  // Stream methods
  observe(id: string): Observable<FlowStream | undefined>;
  notice(id: string, type: PresenceType): void;

  // Navigation methods
  add(id: string, items: any[]): void;
  wake(id: string): void;

  // Flow metrics
  metrics: {
    depth: number;
    harmony: number;
    energy: number;
  };
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