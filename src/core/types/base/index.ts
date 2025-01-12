// Core type definitions

// Type utilities
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: ReadonlyDeep<T[P]>;
};

// Function types
export type AsyncHandler<T = void> = () => Promise<T>;
export type StreamReducer<T, R> = (acc: R, value: T) => R;

// Validation types
export interface ValidationOptions {
  strict?: boolean;
  allowPartial?: boolean;
}

export interface ValidationRule<T> {
  test: (value: T) => boolean;
  message: string;
}

// Domain types
export interface Field {
  resonance: Resonance;
  protection: Protection;
  flowMetrics: FlowMetrics;
  metrics: Metrics;
  strength?: number;
}

export interface Resonance {
  phase: number;
  amplitude: number;
  frequency: number;
  coherence: number;
  harmony: number;
  stability: number;
  harmonics: number[];
}

export interface Protection {
  shields: number;
  resilience: number;
  adaptability: number;
  stability: number;
  integrity: number;
  recovery: number;
  strength: number;
  level: number;
  type: string;
}

export interface FlowMetrics {
  conductivity: number;
  velocity: number;
  coherence: number;
}

export interface Metrics {
  energy: number;
  flow: number;
  coherence: number;
  velocity: number;
  focus: number;
  intensity: number;
  stability: number;
  conductivity: number;
  quality: number;
}

export interface ConsciousnessState {
  awareness: number;
  focus: number;
  clarity: number;
}

export interface FlowState {
  velocity: number;
  direction: number;
  intensity: number;
}

export interface EnergyState {
  current: number;
  capacity: number;
  regeneration: number;
}

export interface ProtectionState {
  shields: number;
  resilience: number;
  adaptability: number;
}

export interface AutonomicState {
  consciousness: ConsciousnessState;
  flow: FlowState;
  energy: EnergyState;
  protection: ProtectionState;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface PredictiveValidation {
  validate(state: AutonomicState): ValidationResult;
  predict(state: AutonomicState): AutonomicState;
}

export interface AutonomicSystem {
  state: AutonomicState;
  validation: PredictiveValidation;
  evolve(targetState: AutonomicState): void;
  protect(): void;
}

export interface EnergySystem {
  state: EnergyState;
  consume(amount: number): void;
  regenerate(): void;
}

export interface FlowMetrics {
  velocity: number;
  coherence: number;
  conductivity: number;
}

export interface Space {
  id: string;
  name: string;
  type: string;
  field: Field;
  metrics: FlowMetrics;
}

// Test enhancement types
export interface TestEnhancedMetrics extends Metrics {
  accuracy: number;
  coverage: number;
  performance: number;
}

export interface TestEnhancedField extends Omit<Field, 'metrics'> {
  metrics: TestEnhancedMetrics;
  results: ValidationResult[];
} 