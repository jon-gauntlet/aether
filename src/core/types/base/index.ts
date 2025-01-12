// Re-export base types
export * from './base';

// Re-export domain types
export type {
  Connection,
  Field,
  NaturalFlow,
  Resonance,
  Protection,
  FlowMetrics,
  EnergyState,
  ConsciousnessState,
  AutonomicState,
  ValidationResult,
  MindSpace
} from './base';

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