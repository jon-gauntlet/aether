import type { BaseState, BaseMetrics } from '@core/types/base/index';
import { createTypeGuard, createValidator, type ValidationResult } from '@core/types';

// Autonomic-specific metrics
export interface AutonomicMetrics extends BaseMetrics {
  readonly adaptability: number;  // 0-1 scale
  readonly resilience: number;  // 0-1 scale
  readonly efficiency: number;  // 0-1 scale
}

// Autonomic state interface
export interface AutonomicState extends BaseState {
  readonly type: 'autonomic';
  readonly metrics: Readonly<AutonomicMetrics>;
  readonly patterns: ReadonlyArray<AutonomicPattern>;
  readonly responses: ReadonlyArray<AutonomicResponse>;
}

// Autonomic pattern interface
export interface AutonomicPattern {
  readonly type: string;
  readonly confidence: number;  // 0-1 scale
  readonly frequency: number;  // occurrences per hour
  readonly lastDetected: number;
}

// Autonomic response interface
export interface AutonomicResponse {
  readonly trigger: string;
  readonly action: string;
  readonly effectiveness: number;  // 0-1 scale
  readonly timestamp: number;
}

// Type guards
export const isAutonomicMetrics = createTypeGuard<AutonomicMetrics>('AutonomicMetrics',
  (value): value is AutonomicMetrics => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'adaptability' in value &&
      'resilience' in value &&
      'efficiency' in value &&
      typeof value.adaptability === 'number' &&
      typeof value.resilience === 'number' &&
      typeof value.efficiency === 'number' &&
      value.adaptability >= 0 &&
      value.adaptability <= 1 &&
      value.resilience >= 0 &&
      value.resilience <= 1 &&
      value.efficiency >= 0 &&
      value.efficiency <= 1
    );
  }
);

export const isAutonomicPattern = createTypeGuard<AutonomicPattern>('AutonomicPattern',
  (value): value is AutonomicPattern => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'type' in value &&
      'confidence' in value &&
      'frequency' in value &&
      'lastDetected' in value &&
      typeof value.type === 'string' &&
      typeof value.confidence === 'number' &&
      typeof value.frequency === 'number' &&
      typeof value.lastDetected === 'number' &&
      value.confidence >= 0 &&
      value.confidence <= 1 &&
      value.frequency >= 0
    );
  }
);

export const isAutonomicResponse = createTypeGuard<AutonomicResponse>('AutonomicResponse',
  (value): value is AutonomicResponse => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'trigger' in value &&
      'action' in value &&
      'effectiveness' in value &&
      'timestamp' in value &&
      typeof value.trigger === 'string' &&
      typeof value.action === 'string' &&
      typeof value.effectiveness === 'number' &&
      typeof value.timestamp === 'number' &&
      value.effectiveness >= 0 &&
      value.effectiveness <= 1
    );
  }
);

export const isAutonomicState = createTypeGuard<AutonomicState>('AutonomicState',
  (value): value is AutonomicState => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'type' in value &&
      value.type === 'autonomic' &&
      'metrics' in value &&
      'patterns' in value &&
      'responses' in value &&
      isAutonomicMetrics(value.metrics) &&
      Array.isArray(value.patterns) &&
      value.patterns.every(isAutonomicPattern) &&
      Array.isArray(value.responses) &&
      value.responses.every(isAutonomicResponse)
    );
  }
);

// Validation functions
export const validateAutonomicMetrics = createValidator('AutonomicMetrics', isAutonomicMetrics, {
  customRules: [
    {
      name: 'autonomic-metrics-health',
      validate: (value: unknown): ValidationResult => {
        if (!isAutonomicMetrics(value)) return { valid: false };
        
        const warnings: string[] = [];
        if (value.adaptability < 0.3) warnings.push('Low adaptability detected');
        if (value.resilience < 0.4) warnings.push('System resilience needs attention');
        if (value.efficiency < 0.5) warnings.push('System efficiency below threshold');
        
        return {
          valid: true,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      }
    }
  ]
});

export const validateAutonomicState = createValidator('AutonomicState', isAutonomicState, {
  customRules: [
    {
      name: 'autonomic-state-health',
      validate: (value: unknown): ValidationResult => {
        if (!isAutonomicState(value)) return { valid: false };
        
        const metricsResult = validateAutonomicMetrics(value.metrics);
        if (!metricsResult.valid) {
          return {
            valid: false,
            errors: ['Invalid autonomic metrics', ...(metricsResult.errors || [])]
          };
        }
        
        const warnings: string[] = [];
        if (value.patterns.length === 0) {
          warnings.push('No autonomic patterns detected');
        }
        
        const avgEffectiveness = value.responses.reduce(
          (sum, response) => sum + response.effectiveness,
          0
        ) / (value.responses.length || 1);
        
        if (avgEffectiveness < 0.6) {
          warnings.push('Low average response effectiveness');
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