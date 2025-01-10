// Core Types
export type NaturalFlowType = 'natural' | 'guided' | 'resonant';

export interface Wave {
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Field {
  center: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  strength: number;
  coherence: number;
  stability: number;
  waves: Wave[];
}

export interface Resonance {
  primary: Wave;
  harmonics: Wave[];
  frequency: number;
  amplitude: number;
  phase: number;
  coherence: number;
  harmony: number;
}

// Flow Types
export interface FlowMetrics extends BaseMetrics {
  depth: number;
  clarity: number;
  stability: number;
  focus: number;
  energy: number;
}

export interface FlowState {
  id: string;
  type: NaturalFlowType | 'protected';
  metrics: FlowMetrics;
  protection: Protection;
  timestamp: number;
}

export interface FlowContext {
  depth: number;
  metrics: {
    coherence: number;
    stability: number;
    quality: number;
  };
  mode: NaturalFlowType;
}

export interface FlowProtection {
  level: number;
  type: 'soft' | 'medium' | 'hard';
}

// Energy Types
export interface EnergyState {
  current: number;
  efficiency: number;
  phase: 'charging' | 'discharging' | 'stable';
}

// Pattern Types
export interface Pattern {
  id: string;
  metrics: {
    coherence: {
      current: number;
      history: number[];
    };
    stability: {
      current: number;
      history: number[];
    };
    evolution: {
      current: number;
      history: number[];
    };
    quality: number;
  };
  context: string[];
  states: PatternState[];
}

export enum PatternState {
  EMERGING = 'emerging',
  STABLE = 'stable',
  EVOLVING = 'evolving',
  DISSOLVING = 'dissolving'
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
  strength: number;
}

// Type Guards
export const isValidMeasure = (value: unknown): value is number => {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= 0 && value <= 1;
};

export const isProtected = (protection: Protection): boolean =>
  protection.level >= 0.8;

export const isCoherent = (metrics: BaseMetrics): boolean =>
