import type { Observable } from 'rxjs';
import type {
  BaseState,
  FlowState,
  FlowMetrics,
  Protection,
  Resonance,
  NaturalPattern,
  Nullable,
  Optional,
  SystemUpdate
} from './base';
import {
  isFlowMetrics,
  isProtection,
  isResonance,
  isNaturalPattern
} from './base';

// Flow state values
export const FLOW_STATES = {
  FLOW: 'FLOW',
  FOCUS: 'FOCUS',
  HYPERFOCUS: 'HYPERFOCUS',
  RECOVERING: 'RECOVERING',
  RESTING: 'RESTING',
  PROTECTED: 'PROTECTED'
} as const;

// Flow-specific state interface
export interface FlowContext extends BaseState {
  readonly type: 'flow';
  readonly state: FlowState;
  readonly metrics: Readonly<FlowMetrics>;
  readonly protection: Readonly<Protection>;
  readonly resonance: Readonly<Resonance>;
  readonly history: Readonly<FlowHistory>;
  readonly patterns: ReadonlyArray<NaturalPattern>;
}

export interface FlowTransition {
  readonly from: FlowState;
  readonly to: FlowState;
  readonly timestamp: number;
  readonly metrics: Readonly<FlowMetrics>;
  readonly reason?: string;
}

export interface FlowHistory {
  readonly transitions: ReadonlyArray<FlowTransition>;
  readonly patterns: ReadonlyArray<NaturalPattern>;
  readonly metrics: Readonly<{
    readonly averageVelocity: number;
    readonly averageFocus: number;
    readonly averageEnergy: number;
    readonly peakPerformance: number;
    readonly sustainedFlowTime: number;
  }>;
}

export interface FlowProtection extends Omit<Protection, 'recovery'> {
  readonly active: boolean;
  readonly triggers: ReadonlyArray<Readonly<{
    readonly condition: string;
    readonly action: string;
    readonly priority: number;
  }>>;
  readonly recoveryState: Readonly<{
    readonly rate: number;
    readonly threshold: number;
    readonly active: boolean;
  }>;
  readonly recovery: number;
}

export interface FlowOptions {
  readonly autoProtect?: boolean;
  readonly minProtectionLevel?: number;
  readonly recoveryThreshold?: number;
  readonly metricsUpdateInterval?: number;
  readonly historySize?: number;
  readonly patternMatching?: boolean;
}

export type FlowStateUpdate = SystemUpdate<FlowContext>;
export type FlowStateObservable = Observable<Nullable<FlowStateUpdate>>;

// Type guards
export const isFlowTransition = (transition: unknown): transition is FlowTransition => {
  if (!transition || typeof transition !== 'object') return false;
  const t = transition as FlowTransition;
  return (
    'from' in t &&
    'to' in t &&
    'timestamp' in t &&
    'metrics' in t &&
    typeof t.timestamp === 'number' &&
    typeof t.from === 'string' &&
    typeof t.to === 'string' &&
    (t.reason === undefined || typeof t.reason === 'string')
  );
};

export const isFlowHistory = (history: unknown): history is FlowHistory => {
  if (!history || typeof history !== 'object') return false;
  const h = history as FlowHistory;
  return (
    'transitions' in h &&
    'patterns' in h &&
    'metrics' in h &&
    Array.isArray(h.transitions) &&
    Array.isArray(h.patterns) &&
    h.transitions.every(isFlowTransition) &&
    typeof h.metrics === 'object' &&
    'averageVelocity' in h.metrics &&
    'averageFocus' in h.metrics &&
    'averageEnergy' in h.metrics &&
    'peakPerformance' in h.metrics &&
    'sustainedFlowTime' in h.metrics &&
    Object.values(h.metrics).every(v => typeof v === 'number')
  );
};

export const isFlowContext = (context: unknown): context is FlowContext => {
  if (!context || typeof context !== 'object') return false;
  const c = context as FlowContext;
  return (
    'type' in c &&
    c.type === 'flow' &&
    'state' in c &&
    'metrics' in c &&
    'protection' in c &&
    'resonance' in c &&
    'history' in c &&
    'patterns' in c &&
    typeof c.state === 'string' &&
    Array.isArray(c.patterns) &&
    isFlowHistory(c.history)
  );
};

// Validation utilities
export const validateFlowTransition = (transition: unknown): FlowTransition => {
  if (!isFlowTransition(transition)) {
    throw new TypeError('Invalid flow transition');
  }
  return transition;
};

export const validateFlowHistory = (history: unknown): FlowHistory => {
  if (!isFlowHistory(history)) {
    throw new TypeError('Invalid flow history');
  }
  return history;
};

export const validateFlowContext = (context: unknown): FlowContext => {
  if (!isFlowContext(context)) {
    throw new TypeError('Invalid flow context');
  }
  return context;
};

export const DEFAULT_FLOW_OPTIONS: Readonly<FlowOptions> = {
  autoProtect: true,
  minProtectionLevel: 0.6,
  recoveryThreshold: 0.3,
  metricsUpdateInterval: 1000,
  historySize: 100,
  patternMatching: true,
};

// Additional type guards
export const isFlowProtectionTrigger = (trigger: unknown): trigger is FlowProtection['triggers'][number] => {
  if (!trigger || typeof trigger !== 'object') return false;
  return (
    'condition' in trigger &&
    'action' in trigger &&
    'priority' in trigger &&
    typeof (trigger as any).condition === 'string' &&
    typeof (trigger as any).action === 'string' &&
    typeof (trigger as any).priority === 'number'
  );
};

export const isFlowProtection = (protection: unknown): protection is FlowProtection => {
  if (!isProtection(protection)) return false;
  const p = protection as FlowProtection;
  return (
    'triggers' in p &&
    'recoveryState' in p &&
    Array.isArray(p.triggers) &&
    p.triggers.every(isFlowProtectionTrigger) &&
    typeof p.recoveryState === 'object' &&
    p.recoveryState !== null &&
    'rate' in p.recoveryState &&
    'threshold' in p.recoveryState &&
    'active' in p.recoveryState &&
    typeof p.recoveryState.rate === 'number' &&
    typeof p.recoveryState.threshold === 'number' &&
    typeof p.recoveryState.active === 'boolean'
  );
};

// Enhanced validation utilities
export const validateMetricRange = (value: number, name: string): number => {
  if (value < 0 || value > 1) {
    throw new RangeError(`${name} must be between 0 and 1, got ${value}`);
  }
  return value;
};

export const validateFlowMetrics = (metrics: unknown): FlowMetrics => {
  if (!isFlowMetrics(metrics)) {
    throw new TypeError('Invalid flow metrics');
  }
  
  // Validate ranges
  Object.entries(metrics).forEach(([key, value]) => {
    validateMetricRange(value, key);
  });
  
  return metrics;
};

export const validateFlowProtection = (protection: unknown): FlowProtection => {
  if (!isFlowProtection(protection)) {
    throw new TypeError('Invalid flow protection');
  }
  
  // Validate ranges
  validateMetricRange(protection.adaptability, 'adaptability');
  validateMetricRange(protection.stability, 'stability');
  validateMetricRange(protection.integrity, 'integrity');
  validateMetricRange(protection.shields, 'shields');
  validateMetricRange(protection.resilience, 'resilience');
  validateMetricRange(protection.recovery, 'recovery');
  validateMetricRange(protection.strength, 'strength');
  validateMetricRange(protection.level, 'level');
  
  return protection;
};

// Stream validation utilities
export const validateFlowStateUpdate = (update: unknown): FlowStateUpdate => {
  if (!update || typeof update !== 'object') {
    throw new TypeError('Invalid flow state update');
  }

  const u = update as FlowStateUpdate;
  if (!('type' in u && 'payload' in u && 'timestamp' in u)) {
    throw new TypeError('Missing required update fields');
  }

  if (!['metrics', 'state', 'protection', 'pattern'].includes(u.type)) {
    throw new TypeError(`Invalid update type: ${u.type}`);
  }

  if (typeof u.timestamp !== 'number') {
    throw new TypeError('Invalid timestamp');
  }

  // Validate payload based on type
  switch (u.type) {
    case 'metrics':
      if (u.payload.metrics) validateFlowMetrics(u.payload.metrics);
      break;
    case 'state':
      if (u.payload.state && !Object.values(FLOW_STATES).includes(u.payload.state)) {
        throw new TypeError(`Invalid flow state: ${u.payload.state}`);
      }
      break;
    case 'protection':
      if (u.payload.protection) validateFlowProtection(u.payload.protection);
      break;
    case 'pattern':
      if (u.payload.patterns) {
        if (!Array.isArray(u.payload.patterns)) {
          throw new TypeError('Patterns must be an array');
        }
        u.payload.patterns.forEach((p, i) => {
          if (!isNaturalPattern(p)) {
            throw new TypeError(`Invalid pattern at index ${i}`);
          }
        });
      }
      break;
  }

  return u;
};