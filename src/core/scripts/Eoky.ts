// Core Types
export interface Wave {
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Field {
  strength: number;
  coherence: number;
  stability: number;
}

export interface Resonance {
  primary: Wave;
  harmonics: Wave[];
}

// Shared Metrics
export interface BaseMetrics {
  intensity: number;
  coherence: number;
  resonance: number;
  presence: number;
  harmony: number;
  rhythm: number;
}

export interface Protection {
  level: number;
  type: 'natural' | 'enhanced' | 'autonomous';
}

// Base State Interface
export interface BaseState {
  id: string;
  timestamp: number;
  metrics: BaseMetrics;
  protection: Protection;
}

// Pattern Types
export interface BasePattern {
  id: string;
  type: string;
  context: string[];
  strength: number;
  evolution: {
    iterations: number;
    success_rate: number;
    strength: number;
  };
}

export interface PatternIndex {
  [key: string]: {
    type: string;
    frequency: number;
    lastUsed: number;
  }
}

// Type Guards
export const isValidMeasure = (value: unknown): value is number => {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= 0 && value <= 1;
};

export const isProtected = (protection: Protection): boolean =>
  protection.level >= 0.8;

export const isCoherent = (metrics: BaseMetrics): boolean =>
  metrics.coherence >= 0.7;

export const hasPattern = (pattern: BasePattern): boolean =>
  pattern.evolution.strength >= 0.7;