// Re-export base types
export * from './base';

// Re-export domain types
export * from './flow';
export * from './space';
export * from './energy';
export * from './protection';
export * from './consciousness';
export * from './autonomic';

// Export commonly used types
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

// Export type utilities
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: ReadonlyDeep<T[P]>;
};

// Export function types
export type AsyncHandler<T = void> = () => Promise<T>;
export type StreamReducer<T, R> = (acc: R, value: T) => R;

// Export validation types
export interface ValidationOptions {
  strict?: boolean;
  allowPartial?: boolean;
}

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

// Type guard creator utility
export function createTypeGuard<T>(typeName: string, guard: (value: unknown) => value is T) {
  return (value: unknown): value is T => {
    try {
      return guard(value);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.warn(`Type guard failed for ${typeName}:`, error.message);
      } else {
        console.warn(`Type guard failed for ${typeName}:`, error);
      }
      return false;
    }
  };
}

// Validator creator utility
export function createValidator<T>(rules: ValidationRule<T>[], options: ValidationOptions = {}) {
  return (value: T): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      try {
        const isValid = rule.validate(value);
        if (!isValid) {
          if (options.strict) {
            errors.push(rule.message);
          } else {
            warnings.push(rule.message);
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          errors.push(`Validation error: ${error.message}`);
        } else {
          errors.push(`Validation error: ${String(error)}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  };
} 