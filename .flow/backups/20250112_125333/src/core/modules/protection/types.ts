import type { BaseState, BaseMetrics } from '@core/types/base/index';
import { createTypeGuard, createValidator, type ValidationResult } from '@core/types';

// Protection-specific metrics
export interface ProtectionMetrics extends BaseMetrics {
  readonly safety: number;  // 0-1 scale
  readonly resilience: number;  // 0-1 scale
  readonly recovery: number;  // 0-1 scale
}

// Protection state interface
export interface ProtectionState extends BaseState {
  readonly type: 'protection';
  readonly metrics: Readonly<ProtectionMetrics>;
  readonly violations: ReadonlyArray<ProtectionViolation>;
  readonly recoveryPlan: Readonly<RecoveryPlan>;
}

// Protection violation interface
export interface ProtectionViolation {
  readonly type: string;
  readonly timestamp: number;
  readonly severity: number;  // 0-1 scale
  readonly context: string;
}

// Recovery plan interface
export interface RecoveryPlan {
  readonly active: boolean;
  readonly startTime: number;
  readonly duration: number;
  readonly steps: ReadonlyArray<RecoveryStep>;
}

// Recovery step interface
export interface RecoveryStep {
  readonly type: string;
  readonly duration: number;
  readonly completed: boolean;
  readonly metrics?: Readonly<ProtectionMetrics>;
}

// Type guards
export const isProtectionMetrics = createTypeGuard<ProtectionMetrics>('ProtectionMetrics',
  (value): value is ProtectionMetrics => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'safety' in value &&
      'resilience' in value &&
      'recovery' in value &&
      typeof value.safety === 'number' &&
      typeof value.resilience === 'number' &&
      typeof value.recovery === 'number' &&
      value.safety >= 0 &&
      value.safety <= 1 &&
      value.resilience >= 0 &&
      value.resilience <= 1 &&
      value.recovery >= 0 &&
      value.recovery <= 1
    );
  }
);

export const isProtectionViolation = createTypeGuard<ProtectionViolation>('ProtectionViolation',
  (value): value is ProtectionViolation => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'type' in value &&
      'timestamp' in value &&
      'severity' in value &&
      'context' in value &&
      typeof value.type === 'string' &&
      typeof value.timestamp === 'number' &&
      typeof value.severity === 'number' &&
      typeof value.context === 'string' &&
      value.severity >= 0 &&
      value.severity <= 1
    );
  }
);

export const isRecoveryStep = createTypeGuard<RecoveryStep>('RecoveryStep',
  (value): value is RecoveryStep => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'type' in value &&
      'duration' in value &&
      'completed' in value &&
      typeof value.type === 'string' &&
      typeof value.duration === 'number' &&
      typeof value.completed === 'boolean' &&
      (!('metrics' in value) || isProtectionMetrics(value.metrics))
    );
  }
);

export const isRecoveryPlan = createTypeGuard<RecoveryPlan>('RecoveryPlan',
  (value): value is RecoveryPlan => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'active' in value &&
      'startTime' in value &&
      'duration' in value &&
      'steps' in value &&
      typeof value.active === 'boolean' &&
      typeof value.startTime === 'number' &&
      typeof value.duration === 'number' &&
      Array.isArray(value.steps) &&
      value.steps.every(isRecoveryStep)
    );
  }
);

export const isProtectionState = createTypeGuard<ProtectionState>('ProtectionState',
  (value): value is ProtectionState => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'type' in value &&
      value.type === 'protection' &&
      'metrics' in value &&
      'violations' in value &&
      'recoveryPlan' in value &&
      isProtectionMetrics(value.metrics) &&
      Array.isArray(value.violations) &&
      value.violations.every(isProtectionViolation) &&
      isRecoveryPlan(value.recoveryPlan)
    );
  }
);

// Validation functions
export const validateProtectionMetrics = createValidator('ProtectionMetrics', isProtectionMetrics, {
  customRules: [
    {
      name: 'protection-metrics-health',
      validate: (value: unknown): ValidationResult => {
        if (!isProtectionMetrics(value)) return { valid: false };
        
        const warnings: string[] = [];
        if (value.safety < 0.3) warnings.push('Safety critically low');
        if (value.resilience < 0.4) warnings.push('Low resilience detected');
        if (value.recovery < 0.5) warnings.push('Recovery capacity diminished');
        
        return {
          valid: true,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      }
    }
  ]
});

export const validateProtectionState = createValidator('ProtectionState', isProtectionState, {
  customRules: [
    {
      name: 'protection-state-health',
      validate: (value: unknown): ValidationResult => {
        if (!isProtectionState(value)) return { valid: false };
        
        const metricsResult = validateProtectionMetrics(value.metrics);
        if (!metricsResult.valid) {
          return {
            valid: false,
            errors: ['Invalid protection metrics', ...(metricsResult.errors || [])]
          };
        }
        
        const warnings: string[] = [];
        if (value.violations.length > 5) {
          warnings.push('High number of protection violations');
        }
        
        return {
          valid: true,
          warnings: [
            ...(metricsResult.warnings || []),
            ...warnings
          ]
        };
      }
    }
  ]
}); 