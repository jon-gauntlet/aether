// Core Types
export type NaturalFlowType = 'natural' | 'guided' | 'protected' | 'enhanced';
export type PresenceType = 'natural' | 'guided' | 'resonant';
export type FlowType = 'focused' | 'diffuse' | 'transitional';
export type DevelopmentPhase = 'initial' | 'emerging' | 'stable' | 'optimizing' | 'protecting';

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
export interface BaseMetrics {
  depth: number;
  clarity: number;
  stability: number;
  focus: number;
  energy: number;
  quality: number;
}

export interface FlowMetrics extends BaseMetrics {
  intensity: number;
  resonance: number;
  harmony: number;
  rhythm: number;
  alignment: number;
  presence: number;
  coherence: number;
}

export interface Protection {
  level: number;
  type: string;
  strength: number;
  resilience: number;
  adaptability: number;
  field?: Field;
  natural: boolean;
}

export interface FlowState {
  id: string;
  type: NaturalFlowType;
  metrics: FlowMetrics;
  protection: Protection;
  timestamp: number;
  quality?: number;
  harmony?: number;
}

export interface Flow {
  id: string;
  type: FlowType;
  state: FlowState;
  transitions: FlowTransition[];
}

export interface FlowTransition {
  from: FlowState;
  to: FlowState;
  timestamp: number;
  duration: number;
  quality: number;
}

export interface FlowSpace {
  id: string;
  type: string;
  flows: Flow[];
  metrics: FlowMetrics;
  protection: Protection;
}

export interface MindSpace {
  id: string;
  type: string;
  flows: Flow[];
  connections: Connection[];
}

export interface Connection {
  from: string;
  to: string;
  strength: number;
  type: string;
}

export interface ConsciousnessState {
  id: string;
  type: string;
  spaces: string[];
  metrics: FlowMetrics;
  protection: Protection;
  resonance: Resonance;
  patterns: Pattern[];
}

export interface Pattern {
  id: string;
  type: string;
  strength: number;
  frequency: number;
  coherence: number;
}

// Flow Types
export interface FlowMetrics extends BaseMetrics {
  depth: number;
  clarity: number;
  stability: number;
  focus: number;
  energy: number;
  quality: number;
}

export interface FlowState {
  id: string;
  type: NaturalFlowType;
  metrics: FlowMetrics;
  protection: Protection;
  timestamp: number;
}

export interface FlowContext {
  id: string;
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
  max: number;
  level: number;
  type: string;
  efficiency: number;
  phase: 'charging' | 'discharging' | 'stable';
  lastTransition: number;
  recoveryRate: number;
  decayRate: number;
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

export interface PatternState {
  id: string;
  type: DevelopmentPhase;
  context: string[];
  states: string[];
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

export interface FlowMetrics extends BaseMetrics {
  depth: number;
  clarity: number;
  stability: number;
  focus: number;
  energy: number;
  quality: number;
}

export interface EnergyMetrics extends BaseMetrics {
  level: number;
  capacity: number;
  stability: number;
  flow: number;
}

export interface ContextMetrics {
  depth: number;
  presence: number;
  coherence: number;
  stability: number;
}

export interface Protection {
  level: number;
  type: string;
  strength?: number;
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

export enum DevelopmentPhase {
  INITIAL = 'initial',
  EMERGING = 'emerging',
  STABLE = 'stable',
  OPTIMIZING = 'optimizing',
  PROTECTING = 'protecting'
}

export interface ConsciousnessState {
  flow: FlowState;
  spaces?: string[];
  metrics?: {
    coherence: number;
    stability: number;
    quality: number;
  };
}

export interface HyperfocusMetrics extends FlowMetrics {
  intensity: number;
  duration: number;
  contextRetention: number;
}

export interface EnhancedEnergyState {
  id: string;
  level: number;
  capacity: number;
  protection: number;
  timestamp: number;
  metrics: EnergyMetrics;
  resonance: Resonance;
  field: Field;
}

export interface ContextState {
  id: string;
  type: string;
  depth: number;
  presence: string;
  flow: string;
  metrics: ContextMetrics;
  protection: Protection;
  timestamp: number;
}

export interface AutonomicState {
  energy: EnhancedEnergyState;
  flow: FlowState;
  context: ContextState;
  protection: Protection;
  pattern: PatternState;
}

export interface IntegrationMetrics {
  harmony: number;
  presence: number;
  clarity: number;
  resonance: number;
  coherence: number;
  alignment: number;
}

export interface SystemState {
  metrics: IntegrationMetrics;
  timestamp: number;
  cycle: CycleType;
}

export type CycleType = 'harmony' | 'reflection' | 'restoration' | 'flow';

export interface TypeValidationResult {
  isValid: boolean;
  errors: string[];
  path: string[];
  energy: number;
  requiredProbability?: number;
  coherence?: number;
  pattern?: string;
  context?: string[];
  flow_state?: {
    depth: number;
    protection: number;
    natural_alignment: number;
  };
  hyperfocus_metrics?: {
    depth: number;
    duration: number;
    energy_efficiency: number;
    context_retention: number;
  };
  developmentPhase?: DevelopmentPhase;
}