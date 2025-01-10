// Core Flow Types
export interface FlowMetrics {
  intensity: number;
  coherence: number; 
  resonance: number;
  presence: number;
  harmony: number;
  rhythm: number;
}

export interface FlowState {
  id: string;
  metrics: FlowMetrics;
  type: 'natural' | 'guided' | 'resonant';
  timestamp: number;
}

export interface NaturalFlow extends FlowState {
  type: 'natural';
}

export type NaturalFlowType = 'natural';

// Space Types
export interface FlowSpace {
  id: string;
  flow: FlowState;
  metrics: FlowMetrics;
  connections: Connection[];
}

export interface MindSpace extends FlowSpace {
  type: 'mind';
  resonance: Resonance;
  protection: Protection;
}

// Energy Types
export interface EnergyState {
  id: string;
  level: number;
  capacity: number;
  protection: number;
  timestamp: number;
  resonance: Resonance;
  field: Field;
}

// System Types
export interface ConsciousnessState {
  id: string;
  flow: FlowState;
  energy: EnergyState;
  spaces: FlowSpace[];
  meta: SystemMeta;
}

export interface SystemMeta {
  version: string;
  lastUpdate: number;
  patterns: PatternIndex;
}

export interface PatternIndex {
  [key: string]: {
    type: string;
    frequency: number;
    lastUsed: number;
  }
}

// Utility Types
export interface Field {
  strength: number;
  coherence: number;
  stability: number;
}

export interface Wave {
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Resonance {
  primary: Wave;
  harmonics: Wave[];
}

export interface Protection {
  level: number;
  type: 'natural' | 'enhanced';
}

export interface Connection {
  source: string;
  target: string;
  strength: number;
}

export interface EnergyFlowMetrics extends FlowMetrics {
  efficiency: number;
  sustainability: number;
}

// Type Guards
export const isProtected = (protection: Protection): boolean =>
  protection.level >= 0.8;

export const isCoherent = (metrics: FlowMetrics): boolean =>
  metrics.coherence >= 0.7;

export const isFlowing = (flow: FlowState): boolean =>
  flow.metrics.intensity >= 0.6;

export const hasPattern = (meta: SystemMeta, patternId: string): boolean =>
  meta.patterns[patternId]?.frequency > 0;

export const isEnergyOptimized = (energy: EnergyState): boolean =>
  energy.level >= 0.7 * energy.capacity;