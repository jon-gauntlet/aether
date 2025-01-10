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
  NaturalFlowType
} from './base';

// Re-export imported types
export type { EnergyState } from './energy';
export type { MindSpace } from './space';

// Extended metrics for advanced flow states
export interface AdvancedFlowMetrics extends FlowMetrics {
  pace: number;
  adaptability: number;
  emergence: number;
  balance: number;
}

export interface FlowSpace {
  id: string;
  type: string;
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
  id?: string;
  from: string;
  to: string;
  sourceId?: string;
  targetId?: string;
  strength: number;
  type: string;
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
