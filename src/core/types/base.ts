import type { Observable } from 'rxjs';

export type FlowState = 'FLOW' | 'FOCUS' | 'HYPERFOCUS' | 'RECOVERING' | 'RESTING' | 'PROTECTED';

export interface Wave {
  id: string;
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Resonance {
  frequency: number;
  amplitude: number;
  phase: number;
  coherence: number;
  harmony: number;
  harmonics: number[];
  stability: number;
}

export interface Protection {
  adaptability: number;
  stability: number;
  integrity: number;
  shields: number;
  resilience: number;
  recovery: number;
  type: 'autonomous' | 'enhanced' | 'passive';
  strength: number;
  level: number;
}

export interface FlowMetrics {
  velocity: number;
  focus: number;
  energy: number;
  intensity: number;
  stability: number;
  coherence: number;
  flow: number;
  conductivity: number;
  quality: number;
}

export interface Field {
  id: string;
  resonance: Resonance;
  protection: Protection;
  metrics: FlowMetrics;
  strength: number;
  flowMetrics: {
    conductivity: number;
    quality: number;
  };
}

export interface EnhancedFlowState {
  id: string;
  metrics: FlowMetrics;
  protection: Protection;
  patterns: NaturalPattern[];
  currentState: FlowState;
  stateHistory: FlowState[];
}

export interface NaturalPattern {
  id: string;
  type: string;
  strength: number;
  resonance: number;
  metrics: {
    stability: {
      current: number;
      history: number[];
    };
    coherence: {
      current: number;
      history: number[];
    };
    harmony: number;
    evolution: {
      current: number;
      history: number[];
    };
    quality: number;
  };
}

export interface SacredSpace {
  id: string;
  type: string;
  metrics: FlowMetrics;
  protection: Protection;
  resonance: Resonance;
}

export interface SystemState {
  id: string;
  flowState: FlowState;
  metrics: FlowMetrics;
  protection: Protection;
  resonance: Resonance;
}

export type NaturalFlowType = 'NATURAL' | 'ENHANCED' | 'PROTECTED';

export interface FlowContext {
  id: string;
  type: NaturalFlowType;
  metrics: FlowMetrics;
  protection: Protection;
  state?: FlowState;
}

export interface FlowProtection {
  id: string;
  type: 'autonomous' | 'enhanced' | 'passive';
  level: number;
  strength: number;
}

export interface EnergyState {
  current: number;
  efficiency: number;
  phase: string;
  mental: number;
  physical: number;
  emotional: number;
  stability: number;
  resonance: number;
  flow: number;
  state?: FlowState;
}

export interface AutonomicMetrics {
  confidence: number;
  pattern_resonance: number;
  flow_protection: number;
  mode: 'passive' | 'active' | 'protective';
  stability: number;
  coherence: number;
  evolution: number;
}

export interface AutonomicState {
  flowState: {
    depth: number;
    resonance: number;
    protection: {
      level: number;
      type: 'autonomous' | 'enhanced' | 'passive';
    };
    current: FlowState;
  };
  patternMetrics: {
    coherence: number;
    resonance: number;
    evolution: number;
    quality: number;
  };
  energyState: EnergyState;
  autonomicMetrics: AutonomicMetrics;
}

// Constants
export const NATURAL_CYCLE = 1.618033988749895; // Golden Ratio
export const GOLDEN_RATIO = NATURAL_CYCLE;
export const SILVER_RATIO = 2.414213562373095;
export const BRONZE_RATIO = 3.302775637731995;

// Re-export common types
export type { Observable };

// Common type utilities
export type BaseMetrics = {
  stability: number;
  coherence: number;
  resonance: number;
  quality: number;
};

export type ValidationResult = {
  isValid: boolean;
  confidence: number;
  metrics: BaseMetrics;
  context?: Record<string, unknown>;
};

export type Pattern = {
  id: string;
  type: string;
  metrics: BaseMetrics;
  state?: FlowState;
};

export type DevelopmentContext = {
  id: string;
  type: string;
  state: FlowState;
  metrics: BaseMetrics;
};

export type ContextState = {
  id: string;
  type: string;
  metrics: BaseMetrics;
  state: FlowState;
};
