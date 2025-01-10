// Core Types
export type NaturalFlowType = 'natural' | 'guided' | 'protected' | 'enhanced';

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
  coherence: number;
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