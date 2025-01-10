import { Observable } from 'rxjs';
import type { Stream as FlowStream } from './stream';
import type { PresenceType } from './stream';
import type { EnergyState } from './energy';
import {
  FlowMetrics,
  FlowState,
  NaturalFlow,
  Field,
  Wave,
  Resonance,
  Protection,
  Connection
} from './base';

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
  resonance: Resonance;
  depth: number;
  protection: Protection;
  connections: Connection[];
  flow: NaturalFlow;
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
  FlowState,
  NaturalFlow,
  Field,
  Wave,
  Resonance,
  Protection,
  Connection
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
