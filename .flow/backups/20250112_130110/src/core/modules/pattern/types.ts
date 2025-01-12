import type { BaseState, BaseMetrics } from '@core/types/base/index';
import { createTypeGuard, createValidator, type ValidationResult } from '@core/types';

// Pattern-specific metrics
export interface PatternMetrics extends BaseMetrics {
  readonly recognition: number;  // 0-1 scale
  readonly emergence: number;  // 0-1 scale
  readonly evolution: number;  // 0-1 scale
}

// Pattern state interface
export interface PatternState extends BaseState {
  readonly type: 'pattern';
  readonly metrics: Readonly<PatternMetrics>;
  readonly instances: ReadonlyArray<PatternInstance>;
  readonly evolution: Readonly<PatternEvolution>;
}

// Pattern instance interface
export interface PatternInstance {
  readonly id: string;
  readonly type: string;
  readonly confidence: number;  // 0-1 scale
  readonly context: string;
  readonly timestamp: number;
}

// Pattern evolution interface
export interface PatternEvolution {
  readonly generation: number;
  readonly fitness: number;  // 0-1 scale
  readonly mutations: ReadonlyArray<PatternMutation>;
  readonly lastEvolved: number;
}

// Pattern mutation interface
export interface PatternMutation {
  readonly type: string;
  readonly impact: number;  // -1 to 1 scale
  readonly timestamp: number;
}

// Type guards
export const isPatternMetrics = createTypeGuard<PatternMetrics>('PatternMetrics',
  (value): value is PatternMetrics => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'recognition' in value &&
      'emergence' in value &&
      'evolution' in value &&
      typeof value.recognition === 'number' &&
      typeof value.emergence === 'number' &&
      typeof value.evolution === 'number' &&
      value.recognition >= 0 &&
      value.recognition <= 1 &&
      value.emergence >= 0 &&
      value.emergence <= 1 &&
      value.evolution >= 0 &&
      value.evolution <= 1
    );
  }
);

export const isPatternInstance = createTypeGuard<PatternInstance>('PatternInstance',
  (value): value is PatternInstance => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'id' in value &&
      'type' in value &&
      'confidence' in value &&
      'context' in value &&
      'timestamp' in value &&
      typeof value.id === 'string' &&
      typeof value.type === 'string' &&
      typeof value.confidence === 'number' &&
      typeof value.context === 'string' &&
      typeof value.timestamp === 'number' &&
      value.confidence >= 0 &&
      value.confidence <= 1
    );
  }
);

export const isPatternMutation = createTypeGuard<PatternMutation>('PatternMutation',
  (value): value is PatternMutation => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'type' in value &&
      'impact' in value &&
      'timestamp' in value &&
      typeof value.type === 'string' &&
      typeof value.impact === 'number' &&
      typeof value.timestamp === 'number' &&
      value.impact >= -1 &&
      value.impact <= 1
    );
  }
);

export const isPatternEvolution = createTypeGuard<PatternEvolution>('PatternEvolution',
  (value): value is PatternEvolution => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'generation' in value &&
      'fitness' in value &&
      'mutations' in value &&
      'lastEvolved' in value &&
      typeof value.generation === 'number' &&
      typeof value.fitness === 'number' &&
      Array.isArray(value.mutations) &&
      typeof value.lastEvolved === 'number' &&
      value.fitness >= 0 &&
      value.fitness <= 1 &&
      value.mutations.every(isPatternMutation)
    );
  }
);

export const isPatternState = createTypeGuard<PatternState>('PatternState',
  (value): value is PatternState => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'type' in value &&
      value.type === 'pattern' &&
      'metrics' in value &&
      'instances' in value &&
      'evolution' in value &&
      isPatternMetrics(value.metrics) &&
      Array.isArray(value.instances) &&
      value.instances.every(isPatternInstance) &&
      isPatternEvolution(value.evolution)
    );
  }
);

// Validation functions
export const validatePatternMetrics = createValidator('PatternMetrics', isPatternMetrics, {
  customRules: [
    {
      name: 'pattern-metrics-health',
      validate: (value: unknown): ValidationResult => {
        if (!isPatternMetrics(value)) return { valid: false };
        
        const warnings: string[] = [];
        if (value.recognition < 0.4) warnings.push('Low pattern recognition');
        if (value.emergence < 0.3) warnings.push('Weak pattern emergence');
        if (value.evolution < 0.5) warnings.push('Pattern evolution needs attention');
        
        return {
          valid: true,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      }
    }
  ]
});

export const validatePatternState = createValidator('PatternState', isPatternState, {
  customRules: [
    {
      name: 'pattern-state-health',
      validate: (value: unknown): ValidationResult => {
        if (!isPatternState(value)) return { valid: false };
        
        const metricsResult = validatePatternMetrics(value.metrics);
        if (!metricsResult.valid) {
          return {
            valid: false,
            errors: ['Invalid pattern metrics', ...(metricsResult.errors || [])]
          };
        }
        
        const warnings: string[] = [];
        if (value.instances.length === 0) {
          warnings.push('No pattern instances detected');
        }
        
        const avgConfidence = value.instances.reduce(
          (sum, instance) => sum + instance.confidence,
          0
        ) / (value.instances.length || 1);
        
        if (avgConfidence < 0.6) {
          warnings.push('Low average pattern confidence');
        }
        
        if (value.evolution.fitness < 0.5) {
          warnings.push('Pattern fitness below threshold');
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