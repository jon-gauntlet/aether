// Development phases
export enum DevelopmentPhase {
  CONFIGURATION = 'CONFIGURATION',
  HEALING = 'HEALING',
  OPTIMIZATION = 'OPTIMIZATION',
  PROTECTION = 'PROTECTION'
}

// Natural system patterns
export interface NaturalPattern {
  id: string;
  type: 'flow' | 'presence' | 'connection' | 'protection';
  strength: number;
  resonance: number;
  evolution: number;
}

// Wave properties
export interface Wave {
  frequency: number;
  amplitude: number;
  phase: number;
}

// Resonance definition
export interface Resonance {
  primary: Wave;
  harmonics: Wave[];
  coherence: number;
  stability: number;
}

// Base metrics shared across systems
export interface BaseMetrics {
  // Core energy metrics
  velocity: number;
  focus: number;
  energy: number;
  
  // Flow metrics
  intensity: number;
  coherence: number;
  resonance: number;
  
  // Presence metrics
  presence: number;
  harmony: number;
  rhythm: number;
  
  // Quality metrics
  depth: number;
  clarity: number;
  stability: number;
  quality: number;
}

// Flow specific metrics
export interface FlowMetrics extends BaseMetrics {}

// Field definition
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

// Protection types
export const ProtectionTypes = {
  NATURAL: 'natural',
  ENHANCED: 'enhanced',
  AUTONOMOUS: 'autonomous',
  STANDARD: 'standard'
} as const;

export type ProtectionType = typeof ProtectionTypes[keyof typeof ProtectionTypes];

// Protection definition
export interface Protection {
  level: number;
  type: ProtectionType;
  strength: number;
  resilience: number;
  adaptability: number;
  natural: boolean;
  field: Field;
}

// Sacred space definition
export interface SacredSpace {
  id: string;
  type: 'flow' | 'presence' | 'connection';
  protection: Protection;
  resonance: Resonance;
  patterns: NaturalPattern[];
}

// Autonomic metrics
export interface AutonomicMetrics {
  confidence: number;
  pattern_resonance: number;
  flow_protection: number;
  mode: 'active' | 'passive' | 'protective';
}

// Energy state
export interface EnergyState {
  current: number;
  efficiency: number;
  phase: 'charging' | 'discharging' | 'stable';
}

// Flow state definition
export interface FlowState {
  id: string;
  type: string;
  metrics: FlowMetrics;
  protection: Protection;
  patterns: NaturalPattern[];
  spaces: SacredSpace[];
  resonance: Resonance;
  timestamp: number;
  developmentPhase: DevelopmentPhase;
  autonomicMetrics: AutonomicMetrics;
  energyState: EnergyState;
} 