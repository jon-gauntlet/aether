import type { Observable } from 'rxjs';

// Core type utilities
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Base metrics interface
export interface BaseMetrics {
  readonly stability: number;
  readonly coherence: number;
  readonly resonance: number;
  readonly quality: number;
}

// Base state interface
export interface BaseState {
  readonly id: string;
  readonly type: string;
  readonly timestamp: number;
  readonly metrics: Readonly<BaseMetrics>;
}

// System-wide update type
export type SystemUpdate<T extends BaseState> = Readonly<{
  type: 'metrics' | 'state' | 'protection' | 'pattern';
  payload: Readonly<Partial<T>>;
  timestamp: number;
}>;

// Validation result interface
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors?: readonly string[];
  readonly warnings?: readonly string[];
}

// Type guards
export const isBaseMetrics = (metrics: unknown): metrics is BaseMetrics => {
  if (!metrics || typeof metrics !== 'object') return false;
  return (
    'stability' in metrics &&
    'coherence' in metrics &&
    'resonance' in metrics &&
    'quality' in metrics &&
    Object.values(metrics).every(v => typeof v === 'number')
  );
};

export const isBaseState = (state: unknown): state is BaseState => {
  if (!state || typeof state !== 'object') return false;
  return (
    'id' in state &&
    'type' in state &&
    'timestamp' in state &&
    'metrics' in state &&
    typeof state.id === 'string' &&
    typeof state.type === 'string' &&
    typeof state.timestamp === 'number' &&
    isBaseMetrics(state.metrics)
  );
};

// Validation utilities
export const validateMetrics = (metrics: unknown): BaseMetrics => {
  if (!isBaseMetrics(metrics)) {
    throw new TypeError('Invalid metrics object');
  }
  return metrics;
};

export const validateState = (state: unknown): BaseState => {
  if (!isBaseState(state)) {
    throw new TypeError('Invalid state object');
  }
  return state;
};

// Flow state types
export type FlowState = 'FLOW' | 'FOCUS' | 'HYPERFOCUS' | 'RECOVERING' | 'RESTING' | 'PROTECTED';

// Base interfaces
export interface Connection {
  readonly id: string;
  readonly type: string;
  readonly strength: number;
  readonly stability: number;
}

export interface Field {
  readonly center: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
  };
  readonly radius: number;
  readonly strength: number;
  readonly coherence: number;
  readonly stability: number;
}

export interface NaturalFlow {
  readonly id: string;
  readonly type: 'flow' | 'presence' | 'connection';
  readonly strength: number;
  readonly resonance: number;
  readonly evolution: number;
}

export interface Resonance {
  readonly primary: {
    readonly frequency: number;
    readonly amplitude: number;
    readonly phase: number;
  };
  readonly harmonics: Array<{
    readonly frequency: number;
    readonly amplitude: number;
    readonly phase: number;
  }>;
  readonly coherence: number;
  readonly stability: number;
}

export interface Protection {
  readonly level: number;
  readonly type: 'natural' | 'enhanced' | 'autonomous' | 'standard';
  readonly strength: number;
  readonly resilience: number;
  readonly adaptability: number;
  readonly natural: boolean;
  readonly field: Field;
}

export interface FlowMetrics {
  readonly intensity: number;
  readonly stability: number;
  readonly conductivity: number;
  readonly velocity: number;
  readonly focus: number;
  readonly energy: number;
}

export interface EnergyState {
  readonly current: number;
  readonly efficiency: number;
  readonly phase: 'charging' | 'discharging' | 'stable';
}

export interface ConsciousnessState {
  readonly id: string;
  readonly level: number;
  readonly clarity: number;
  readonly presence: number;
}

export interface AutonomicState {
  readonly id: string;
  readonly mode: 'active' | 'passive' | 'protective';
  readonly confidence: number;
  readonly adaptability: number;
}

export interface MindSpace {
  readonly id: string;
  readonly type: 'flow' | 'presence' | 'connection';
  readonly protection: Protection;
  readonly resonance: Resonance;
  readonly patterns: NaturalFlow[];
}

export interface NaturalPattern {
  readonly id: string;
  readonly type: string;
  readonly strength: number;
  readonly resonance: number;
  readonly metrics: Readonly<{
    readonly stability: {
      readonly current: number;
      readonly history: readonly number[];
    };
    readonly coherence: {
      readonly current: number;
      readonly history: readonly number[];
    };
    readonly harmony: number;
    readonly evolution: {
      readonly current: number;
      readonly history: readonly number[];
    };
    readonly quality: number;
  }>;
}

// Type guards
export function isConnection(value: unknown): value is Connection {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'strength' in value &&
    'stability' in value
  );
}

export function isField(value: unknown): value is Field {
  return (
    typeof value === 'object' &&
    value !== null &&
    'center' in value &&
    'radius' in value &&
    'strength' in value &&
    'coherence' in value &&
    'stability' in value
  );
}

export function isNaturalFlow(value: unknown): value is NaturalFlow {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'strength' in value &&
    'resonance' in value &&
    'evolution' in value
  );
}

export function isResonance(value: unknown): value is Resonance {
  return (
    typeof value === 'object' &&
    value !== null &&
    'primary' in value &&
    'harmonics' in value &&
    'coherence' in value &&
    'stability' in value &&
    typeof value.primary === 'object' &&
    value.primary !== null &&
    'frequency' in value.primary &&
    'amplitude' in value.primary &&
    'phase' in value.primary &&
    Array.isArray(value.harmonics) &&
    value.harmonics.every(h => 
      typeof h === 'object' &&
      h !== null &&
      'frequency' in h &&
      'amplitude' in h &&
      'phase' in h
    )
  );
}

export function isProtection(value: unknown): value is Protection {
  return (
    typeof value === 'object' &&
    value !== null &&
    'level' in value &&
    'type' in value &&
    'strength' in value &&
    'resilience' in value &&
    'adaptability' in value &&
    'natural' in value &&
    'field' in value &&
    isField(value.field)
  );
}

export function isFlowMetrics(value: unknown): value is FlowMetrics {
  return (
    typeof value === 'object' &&
    value !== null &&
    'intensity' in value &&
    'stability' in value &&
    'conductivity' in value &&
    'velocity' in value &&
    'focus' in value &&
    'energy' in value
  );
}

export function isEnergyState(value: unknown): value is EnergyState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'current' in value &&
    'efficiency' in value &&
    'phase' in value
  );
}

export function isConsciousnessState(value: unknown): value is ConsciousnessState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'level' in value &&
    'clarity' in value &&
    'presence' in value
  );
}

export function isAutonomicState(value: unknown): value is AutonomicState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'mode' in value &&
    'confidence' in value &&
    'adaptability' in value
  );
}

export function isMindSpace(value: unknown): value is MindSpace {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'protection' in value &&
    'resonance' in value &&
    'patterns' in value &&
    isProtection(value.protection) &&
    isResonance(value.resonance) &&
    Array.isArray(value.patterns) &&
    value.patterns.every(isNaturalFlow)
  );
}
