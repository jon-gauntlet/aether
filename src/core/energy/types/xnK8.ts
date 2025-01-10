import { Observable } from 'rxjs';
import type { Stream as FlowStream } from './stream';
import type { PresenceType } from './stream';
import type { NaturalFlow } from './flow';
import type { EnergyState } from './energy';
import type { MindSpace } from './space';

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

export interface Protection {
  strength: number;
  resilience: number;
  adaptability: number;
  field?: Field;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  strength: number;
  type: string;
}

export interface FlowSpace {
  id: string;
  type: string;
  resonance: Resonance;
  depth: number;
  protection: Protection;
  connections: Connection[];
}

export interface FlowSpaceState {
  id: string;
  type: string;
  metrics: FlowMetrics;
  connections: Connection[];
}

export interface ThoughtStream {
  id: string;
  flow: NaturalFlow;
  resonance: Resonance;
  depth: number;
}

export interface ThoughtEvolution {
  id: string;
  streamId: string;
  changes: Partial<ThoughtStream>;
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
  id?: string;
  type?: string;
  flow: NaturalFlow;
  energy: EnergyState;
  space?: FlowSpace;
  spaces: FlowSpace[];
  resonance?: Resonance;
  depth?: number;
  protection?: Protection;
  coherence: number;
  timestamp: number;
}

export interface SystemMeta {
  baseFrequency: number;
  baseAmplitude: number;
  baseHarmony: number;
  baseProtection: Protection;
}

// Type guards
export const isProtected = (state: ConsciousnessState): boolean => {
  return !!state.protection && state.protection.strength > 0.5;
};

export const isCoherent = (state: ConsciousnessState): boolean => {
  return state.coherence > 0.7;
};

export const isFlowing = (state: ConsciousnessState): boolean => {
  return state.flow && state.coherence > 0.8;
};