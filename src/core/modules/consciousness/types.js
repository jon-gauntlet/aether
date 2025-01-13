import type { BaseState, BaseMetrics } from '@core/types/base/index';
import { createTypeGuard, createValidator, type ValidationResult } from '@core/types';

// Consciousness-specific metrics
export interface ConsciousnessMetrics extends BaseMetrics {
  readonly awareness: number;  // 0-1 scale
  readonly presence: number;  // 0-1 scale
  readonly clarity: number;  // 0-1 scale
}

// Consciousness state interface
export interface ConsciousnessState extends BaseState {
  readonly type: 'consciousness';
  readonly metrics: Readonly<ConsciousnessMetrics>;
  readonly patterns: ReadonlyArray<ConsciousnessPattern>;
  readonly context: Readonly<ConsciousnessContext>;
}

// Consciousness pattern interface
export interface ConsciousnessPattern {
  readonly type: string;
  readonly strength: number;  // 0-1 scale
  readonly frequency: number;  // occurrences per hour
  readonly lastObserved: number;
}

// Consciousness context interface
export interface ConsciousnessContext {
  readonly focus: string;
  readonly depth: number;  // 0-1 scale
  readonly quality: number;  // 0-1 scale
  readonly timestamp: number;
}

// Type guards
export const isConsciousnessMetrics = createTypeGuard<ConsciousnessMetrics>('ConsciousnessMetrics',
  (value): value is ConsciousnessMetrics => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'awareness' in value &&
      'presence' in value &&
      'clarity' in value &&
      typeof value.awareness === 'number' &&
      typeof value.presence === 'number' &&
      typeof value.clarity === 'number' &&
      value.awareness >= 0 &&
      value.awareness <= 1 &&
      value.presence >= 0 &&
      value.presence <= 1 &&
      value.clarity >= 0 &&
      value.clarity <= 1
    );
  }
);

export const isConsciousnessPattern = createTypeGuard<ConsciousnessPattern>('ConsciousnessPattern',
  (value): value is ConsciousnessPattern => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'type' in value &&
      'strength' in value &&
      'frequency' in value &&
      'lastObserved' in value &&
      typeof value.type === 'string' &&
      typeof value.strength === 'number' &&
      typeof value.frequency === 'number' &&
      typeof value.lastObserved === 'number' &&
      value.strength >= 0 &&
      value.strength <= 1 &&
      value.frequency >= 0
    );
  }
);

export const isConsciousnessContext = createTypeGuard<ConsciousnessContext>('ConsciousnessContext',
  (value): value is ConsciousnessContext => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'focus' in value &&
      'depth' in value &&
      'quality' in value &&
      'timestamp' in value &&
      typeof value.focus === 'string' &&
      typeof value.depth === 'number' &&
      typeof value.quality === 'number' &&
      typeof value.timestamp === 'number' &&
      value.depth >= 0 &&
      value.depth <= 1 &&
      value.quality >= 0 &&
      value.quality <= 1
    );
  }
);

export const isConsciousnessState = createTypeGuard<ConsciousnessState>('ConsciousnessState',
  (value): value is ConsciousnessState => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'type' in value &&
      value.type === 'consciousness' &&
      'metrics' in value &&
      'patterns' in value &&
      'context' in value &&
      isConsciousnessMetrics(value.metrics) &&
      Array.isArray(value.patterns) &&
      value.patterns.every(isConsciousnessPattern) &&
      isConsciousnessContext(value.context)
    );
  }
);

// Validation functions
export const validateConsciousnessMetrics = createValidator('ConsciousnessMetrics', isConsciousnessMetrics, {
  customRules: [
    {
      name: 'consciousness-metrics-health',
      validate: (value: unknown): ValidationResult => {
        if (!isConsciousnessMetrics(value)) return { valid: false };
        
        const warnings: string[] = [];
        if (value.awareness < 0.3) warnings.push('Low awareness level');
        if (value.presence < 0.4) warnings.push('Presence needs attention');
        if (value.clarity < 0.4) warnings.push('Mental clarity diminished');
        
        return {
          valid: true,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      }
    }
  ]
});

export const validateConsciousnessState = createValidator('ConsciousnessState', isConsciousnessState, {
  customRules: [
    {
      name: 'consciousness-state-health',
      validate: (value: unknown): ValidationResult => {
        if (!isConsciousnessState(value)) return { valid: false };
        
        const metricsResult = validateConsciousnessMetrics(value.metrics);
        if (!metricsResult.valid) {
          return {
            valid: false,
            errors: ['Invalid consciousness metrics', ...(metricsResult.errors || [])]
          };
        }
        
        const warnings: string[] = [];
        if (value.patterns.length === 0) {
          warnings.push('No consciousness patterns detected');
        }
        
        if (value.context.quality < 0.5) {
          warnings.push('Low quality consciousness state');
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