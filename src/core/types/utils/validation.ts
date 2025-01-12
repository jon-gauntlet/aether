import { ConsciousnessState } from './consciousness';
import { FlowState, FlowMetrics } from './flow';
import { EnergyState } from './energy';
import { ProtectionState } from './protection';

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  path: string[];
}

// Validation error
export interface ValidationError {
  code: string;
  message: string;
  path: string[];
  value?: any;
}

// Validation warning
export interface ValidationWarning {
  code: string;
  message: string;
  path: string[];
  threshold?: number;
  actual?: number;
}

// State validation
export interface StateValidation {
  consciousness: ValidationResult;
  flow: ValidationResult;
  energy: ValidationResult;
  protection: ValidationResult;
}

// Validation functions
export const validateConsciousness = (state: ConsciousnessState, path: string[] = []): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Add basic validation logic
  if (state.depth < 0) {
    errors.push({
      code: 'INVALID_DEPTH',
      message: 'Depth cannot be negative',
      path: [...path, 'depth'],
      value: state.depth
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    path
  };
};

export const validateFlow = (state: FlowState, metrics: FlowMetrics, path: string[] = []): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Add flow validation logic
  if (metrics.coherence < 0 || metrics.coherence > 1) {
    errors.push({
      code: 'INVALID_COHERENCE',
      message: 'Coherence must be between 0 and 1',
      path: [...path, 'coherence'],
      value: metrics.coherence
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    path
  };
};

export const validateEnergy = (state: EnergyState, path: string[] = []): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Add energy validation logic
  if (state.level < 0) {
    errors.push({
      code: 'INVALID_ENERGY',
      message: 'Energy level cannot be negative',
      path: [...path, 'level'],
      value: state.level
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    path
  };
};

export const validateProtection = (state: ProtectionState, path: string[] = []): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Add protection validation logic
  if (state.level < 0) {
    errors.push({
      code: 'INVALID_PROTECTION',
      message: 'Protection level cannot be negative',
      path: [...path, 'level'],
      value: state.level
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    path
  };
};
