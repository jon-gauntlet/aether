import type { BaseState, BaseMetrics } from '@core/types/base/index';
import { createTypeGuard, createValidator, type ValidationResult, type ValidationRule } from '@core/types';

// Flow-specific metrics
export interface FlowMetrics extends BaseMetrics {
  readonly focus: number;  // 0-1 scale
  readonly energy: number;  // 0-1 scale
  readonly coherence: number;  // 0-1 scale
}

// Flow state interface
export interface FlowState extends BaseState {
  readonly type: 'flow';
  readonly metrics: Readonly<FlowMetrics>;
  readonly history: ReadonlyArray<FlowTransition>;
  readonly protection: Readonly<FlowProtection>;
}

// Flow transition interface
export interface FlowTransition {
  readonly from: FlowStateType;
  readonly to: FlowStateType;
  readonly timestamp: number;
  readonly trigger: string;
}

// Flow protection interface
export interface FlowProtection {
  readonly active: boolean;
  readonly level: ProtectionLevelType;
  readonly triggers: ReadonlyArray<string>;
  readonly lastUpdate: number;
}

// Flow state type
export const FLOW_STATES = ['FLOW', 'FOCUS', 'REST', 'RECOVERY'] as const;
export type FlowStateType = typeof FLOW_STATES[number];

// Protection level type
export const PROTECTION_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'MAXIMUM'] as const;
export type ProtectionLevelType = typeof PROTECTION_LEVELS[number];

// Type guards
export const isFlowMetrics = createTypeGuard<FlowMetrics>('FlowMetrics', 
  (value): value is FlowMetrics => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'focus' in value &&
      'energy' in value &&
      'coherence' in value &&
      typeof value.focus === 'number' &&
      typeof value.energy === 'number' &&
      typeof value.coherence === 'number' &&
      value.focus >= 0 &&
      value.focus <= 1 &&
      value.energy >= 0 &&
      value.energy <= 1 &&
      value.coherence >= 0 &&
      value.coherence <= 1
    );
  }
);

export const isFlowTransition = createTypeGuard<FlowTransition>('FlowTransition',
  (value): value is FlowTransition => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'from' in value &&
      'to' in value &&
      'timestamp' in value &&
      'trigger' in value &&
      typeof value.from === 'string' &&
      typeof value.to === 'string' &&
      typeof value.timestamp === 'number' &&
      typeof value.trigger === 'string' &&
      FLOW_STATES.includes(value.from as any) &&
      FLOW_STATES.includes(value.to as any)
    );
  }
);

export const isFlowProtection = createTypeGuard<FlowProtection>('FlowProtection',
  (value): value is FlowProtection => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'active' in value &&
      'level' in value &&
      'triggers' in value &&
      'lastUpdate' in value &&
      typeof value.active === 'boolean' &&
      typeof value.level === 'string' &&
      Array.isArray(value.triggers) &&
      typeof value.lastUpdate === 'number' &&
      PROTECTION_LEVELS.includes(value.level as any) &&
      value.triggers.every(t => typeof t === 'string')
    );
  }
);

export const isFlowState = createTypeGuard<FlowState>('FlowState',
  (value): value is FlowState => {
    if (!value || typeof value !== 'object') return false;
    
    return (
      'type' in value &&
      value.type === 'flow' &&
      'metrics' in value &&
      'history' in value &&
      'protection' in value &&
      isFlowMetrics(value.metrics) &&
      Array.isArray(value.history) &&
      value.history.every(isFlowTransition) &&
      isFlowProtection(value.protection)
    );
  }
);

// Validation functions
export const validateFlowMetrics = createValidator('FlowMetrics', isFlowMetrics, {
  customRules: [
    {
      name: 'energy-focus-coherence',
      validate: (value: unknown): ValidationResult => {
        if (!isFlowMetrics(value)) return { valid: false };
        
        const warnings: string[] = [];
        if (value.energy < 0.2) warnings.push('Energy critically low');
        if (value.focus < 0.3) warnings.push('Focus below threshold');
        if (value.coherence < 0.4) warnings.push('Low coherence detected');
        
        return {
          valid: true,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      }
    }
  ]
});

export const validateFlowState = createValidator('FlowState', isFlowState, {
  customRules: [
    {
      name: 'flow-state-health',
      validate: (value: unknown): ValidationResult => {
        if (!isFlowState(value)) return { valid: false };
        
        const metricsResult = validateFlowMetrics(value.metrics);
        if (!metricsResult.valid) {
          return {
            valid: false,
            errors: ['Invalid flow metrics', ...(metricsResult.errors || [])]
          };
        }
        
        return {
          valid: true,
          warnings: metricsResult.warnings
        };
      }
    }
  ]
}); 