import { Observable } from 'rxjs';
import type { Stream } from './stream';
import type { PresenceType } from './stream';
import type { EnergyState } from './energy';
import type { MindSpace } from './space';
import {
  FlowMetrics,
  NaturalFlow,
  Field,
  Wave,
  Resonance,
  Protection,
  NaturalFlowType,
  FlowState
} from './base';

// Re-export imported types
export type { EnergyState } from './energy';
export type { MindSpace } from './space';
export type { FlowState } from './base';

// Extended metrics for advanced flow states
export interface AdvancedFlowMetrics extends FlowMetrics {
  pace: number;
  adaptability: number;
  emergence: number;
  balance: number;
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

export interface Connection {
  id: string;
  type: string;
  strength: number;
  quality: number;
}

// Extended flow with additional capabilities
export interface Flow extends NaturalFlow {
  // Stream methods
  observe(id: string): Observable<Stream | undefined>;
  notice(id: string, type: PresenceType): void;
  stream?: Stream;

  // Navigation methods
  add(id: string, items: any[]): void;
  wake(id: string): void;

  // Flow metrics
  metrics: FlowMetrics;
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

export interface SystemMeta {
  baseFrequency: number;
  baseAmplitude: number;
  baseHarmony: number;
  baseProtection: Protection;
}

// Re-export base types
export type {
  FlowMetrics,
  NaturalFlow,
  Field,
  Wave,
  Resonance,
  Protection,
  NaturalFlowType
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