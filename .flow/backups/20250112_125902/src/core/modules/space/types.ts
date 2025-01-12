import type { BaseState, BaseMetrics } from '@core/types/base/index';
import { createTypeGuard, createValidator, type ValidationResult } from '@core/types';

// Space-specific metrics
export interface SpaceMetrics extends BaseMetrics {
  readonly harmony: number;  // 0-1 scale
  readonly resonance: number;  // 0-1 scale
  readonly coherence: number;  // 0-1 scale
}

// Space state interface
export interface SpaceState extends BaseState {
  readonly type: 'space';
  readonly metrics: Readonly<SpaceMetrics>;
  readonly fields: ReadonlyArray<SpaceField>;
  readonly boundaries: Readonly<SpaceBoundaries>;
}

// Space field interface
export interface SpaceField {
  readonly id: string;
  readonly type: string;
  readonly strength: number;  // 0-1 scale
  readonly harmonics: ReadonlyArray<number>;  // 0-1 scale
  readonly lastUpdated: number;
}

// Space boundaries interface
export interface SpaceBoundaries {
  readonly permeability: number;  // 0-1 scale
  readonly flexibility: number;  // 0-1 scale
  readonly resilience: number;  // 0-1 scale
  readonly lastAdjusted: number;
}

// Type guards
export const isSpaceMetrics = createTypeGuard<SpaceMetrics>('SpaceMetrics',
  (value): value is SpaceMetrics => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'harmony' in value &&
      'resonance' in value &&
      'coherence' in value &&
      typeof value.harmony === 'number' &&
      typeof value.resonance === 'number' &&
      typeof value.coherence === 'number' &&
      value.harmony >= 0 &&
      value.harmony <= 1 &&
      value.resonance >= 0 &&
      value.resonance <= 1 &&
      value.coherence >= 0 &&
      value.coherence <= 1
    );
  }
);

export const isSpaceField = createTypeGuard<SpaceField>('SpaceField',
  (value): value is SpaceField => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'id' in value &&
      'type' in value &&
      'strength' in value &&
      'harmonics' in value &&
      'lastUpdated' in value &&
      typeof value.id === 'string' &&
      typeof value.type === 'string' &&
      typeof value.strength === 'number' &&
      Array.isArray(value.harmonics) &&
      value.harmonics.every(h => typeof h === 'number' && h >= 0 && h <= 1) &&
      typeof value.lastUpdated === 'number' &&
      value.strength >= 0 &&
      value.strength <= 1
    );
  }
);

export const isSpaceBoundaries = createTypeGuard<SpaceBoundaries>('SpaceBoundaries',
  (value): value is SpaceBoundaries => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'permeability' in value &&
      'flexibility' in value &&
      'resilience' in value &&
      'lastAdjusted' in value &&
      typeof value.permeability === 'number' &&
      typeof value.flexibility === 'number' &&
      typeof value.resilience === 'number' &&
      typeof value.lastAdjusted === 'number' &&
      value.permeability >= 0 &&
      value.permeability <= 1 &&
      value.flexibility >= 0 &&
      value.flexibility <= 1 &&
      value.resilience >= 0 &&
      value.resilience <= 1
    );
  }
);

export const isSpaceState = createTypeGuard<SpaceState>('SpaceState',
  (value): value is SpaceState => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'type' in value &&
      value.type === 'space' &&
      'metrics' in value &&
      'fields' in value &&
      'boundaries' in value &&
      isSpaceMetrics(value.metrics) &&
      Array.isArray(value.fields) &&
      value.fields.every(isSpaceField) &&
      isSpaceBoundaries(value.boundaries)
    );
  }
);

// Validation functions
export const validateSpaceMetrics = createValidator('SpaceMetrics', isSpaceMetrics, {
  customRules: [
    {
      name: 'space-metrics-health',
      validate: (value: unknown): ValidationResult => {
        if (!isSpaceMetrics(value)) return { valid: false };
        
        const warnings: string[] = [];
        if (value.harmony < 0.4) warnings.push('Low harmonic resonance');
        if (value.resonance < 0.4) warnings.push('Weak field resonance');
        if (value.coherence < 0.5) warnings.push('Space coherence needs attention');
        
        return {
          valid: true,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      }
    }
  ]
});

export const validateSpaceState = createValidator('SpaceState', isSpaceState, {
  customRules: [
    {
      name: 'space-state-health',
      validate: (value: unknown): ValidationResult => {
        if (!isSpaceState(value)) return { valid: false };
        
        const metricsResult = validateSpaceMetrics(value.metrics);
        if (!metricsResult.valid) {
          return {
            valid: false,
            errors: ['Invalid space metrics', ...(metricsResult.errors || [])]
          };
        }
        
        const warnings: string[] = [];
        if (value.fields.length === 0) {
          warnings.push('No active fields detected');
        }
        
        const avgFieldStrength = value.fields.reduce(
          (sum, field) => sum + field.strength,
          0
        ) / (value.fields.length || 1);
        
        if (avgFieldStrength < 0.5) {
          warnings.push('Low average field strength');
        }
        
        if (value.boundaries.permeability > 0.8) {
          warnings.push('High boundary permeability');
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