import type { BaseState, BaseMetrics } from '@core/types/base/index';
import { createTypeGuard, createValidator, type ValidationResult } from '@core/types';

// Energy-specific metrics
export interface EnergyMetrics extends BaseMetrics {
  readonly mental: number;  // 0-1 scale
  readonly physical: number;  // 0-1 scale
  readonly emotional: number;  // 0-1 scale
}

// Energy state interface
export interface EnergyState extends BaseState {
  readonly type: 'energy';
  readonly metrics: Readonly<EnergyMetrics>;
  readonly history: ReadonlyArray<EnergyTransition>;
  readonly reserves: Readonly<EnergyReserves>;
}

// Energy transition interface
export interface EnergyTransition {
  readonly from: EnergyLevelType;
  readonly to: EnergyLevelType;
  readonly timestamp: number;
  readonly cause: string;
}

// Energy reserves interface
export interface EnergyReserves {
  readonly mental: number;  // 0-1 scale
  readonly physical: number;  // 0-1 scale
  readonly emotional: number;  // 0-1 scale
  readonly lastReplenished: number;
}

// Energy level type
export const ENERGY_LEVELS = ['HIGH', 'MEDIUM', 'LOW', 'CRITICAL'] as const;
export type EnergyLevelType = typeof ENERGY_LEVELS[number];

// Type guards
export const isEnergyMetrics = createTypeGuard<EnergyMetrics>('EnergyMetrics',
  (value): value is EnergyMetrics => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'mental' in value &&
      'physical' in value &&
      'emotional' in value &&
      typeof value.mental === 'number' &&
      typeof value.physical === 'number' &&
      typeof value.emotional === 'number' &&
      value.mental >= 0 &&
      value.mental <= 1 &&
      value.physical >= 0 &&
      value.physical <= 1 &&
      value.emotional >= 0 &&
      value.emotional <= 1
    );
  }
);

export const isEnergyTransition = createTypeGuard<EnergyTransition>('EnergyTransition',
  (value): value is EnergyTransition => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'from' in value &&
      'to' in value &&
      'timestamp' in value &&
      'cause' in value &&
      typeof value.from === 'string' &&
      typeof value.to === 'string' &&
      typeof value.timestamp === 'number' &&
      typeof value.cause === 'string' &&
      ENERGY_LEVELS.includes(value.from as any) &&
      ENERGY_LEVELS.includes(value.to as any)
    );
  }
);

export const isEnergyReserves = createTypeGuard<EnergyReserves>('EnergyReserves',
  (value): value is EnergyReserves => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'mental' in value &&
      'physical' in value &&
      'emotional' in value &&
      'lastReplenished' in value &&
      typeof value.mental === 'number' &&
      typeof value.physical === 'number' &&
      typeof value.emotional === 'number' &&
      typeof value.lastReplenished === 'number' &&
      value.mental >= 0 &&
      value.mental <= 1 &&
      value.physical >= 0 &&
      value.physical <= 1 &&
      value.emotional >= 0 &&
      value.emotional <= 1
    );
  }
);

export const isEnergyState = createTypeGuard<EnergyState>('EnergyState',
  (value): value is EnergyState => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'type' in value &&
      value.type === 'energy' &&
      'metrics' in value &&
      'history' in value &&
      'reserves' in value &&
      isEnergyMetrics(value.metrics) &&
      Array.isArray(value.history) &&
      value.history.every(isEnergyTransition) &&
      isEnergyReserves(value.reserves)
    );
  }
);

// Validation functions
export const validateEnergyMetrics = createValidator('EnergyMetrics', isEnergyMetrics, {
  customRules: [
    {
      name: 'energy-metrics-health',
      validate: (value: unknown): ValidationResult => {
        if (!isEnergyMetrics(value)) return { valid: false };
        
        const warnings: string[] = [];
        if (value.mental < 0.2) warnings.push('Mental energy critically low');
        if (value.physical < 0.2) warnings.push('Physical energy critically low');
        if (value.emotional < 0.2) warnings.push('Emotional energy critically low');
        
        return {
          valid: true,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      }
    }
  ]
});

export const validateEnergyState = createValidator('EnergyState', isEnergyState, {
  customRules: [
    {
      name: 'energy-state-health',
      validate: (value: unknown): ValidationResult => {
        if (!isEnergyState(value)) return { valid: false };
        
        const metricsResult = validateEnergyMetrics(value.metrics);
        if (!metricsResult.valid) {
          return {
            valid: false,
            errors: ['Invalid energy metrics', ...(metricsResult.errors || [])]
          };
        }
        
        const warnings: string[] = [];
        const avgReserves = (
          value.reserves.mental +
          value.reserves.physical +
          value.reserves.emotional
        ) / 3;
        
        if (avgReserves < 0.3) {
          warnings.push('Energy reserves running low');
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