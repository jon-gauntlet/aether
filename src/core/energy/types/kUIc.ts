import { Observable } from 'rxjs';
import { Stream } from './stream';

// Core metrics interface
export interface FlowMetrics {
  depth: number;
  harmony: number;
  energy: number;
  presence: number;
  resonance: number;
  coherence: number;
  rhythm: number;
  stillness?: number;
  clarity?: number;
}

// Flow type definitions
export type NaturalFlowType = 'natural' | 'guided' | 'resonant';

// Base state interface
export interface FlowState extends FlowMetrics {
  metrics: FlowMetrics;
  observeDepth: () => Observable<number>;
  observeEnergy: () => Observable<number>;
  observeFocus: () => Observable<number>;
}

// Natural flow extends flow state
export interface NaturalFlow extends FlowState {
  type: NaturalFlowType;
  timestamp: number;
}

// Field and wave definitions
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

// Resonance and protection
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

// Connection interfaces
export interface Connection {
  id: string;
  type: string;
  strength: number;
  quality: number;
  // Legacy support
  from?: string;
  to?: string;
  sourceId?: string;
  targetId?: string;
}

// Space and state interfaces
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

// MindSpace represents a mental space configuration
export interface MindSpace {
  id: string;
  type: 'meditation' | 'focus' | 'flow';
  metrics: FlowMetrics;
  resonance: Resonance;
  depth: number;
  protection: Protection;
  connections: Connection[];
  flow: NaturalFlow;
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

// System metadata
export interface SystemMeta {
  baseFrequency: number;
  baseAmplitude: number;
  baseHarmony: number;
  baseProtection: Protection;
}

// Flow interfaces
export interface Flow extends NaturalFlow {
  observe(id: string): Observable<Stream | undefined>;
  notice(id: string, type: string): void;
  add(id: string, items: any[]): void;
  wake(id: string): void;
  stream?: Stream;
}

// Type guards
export const isProtected = (state: ConsciousnessState): boolean => {
  return !!state.protection && state.protection.strength > 0.5;
};

export const isCoherent = (state: ConsciousnessState): boolean => {
  return state.coherence > 0.7;
};

export const isFlowing = (state: ConsciousnessState): boolean => {
  return !!state.flow && state.coherence > 0.8;
}; 