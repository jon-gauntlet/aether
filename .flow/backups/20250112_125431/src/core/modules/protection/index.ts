export * from './types';

// Protection-specific constants
export const MIN_PROTECTION_DURATION = 5 * 60 * 1000; // 5 minutes
export const MAX_PROTECTION_DURATION = 60 * 60 * 1000; // 1 hour
export const VIOLATION_THRESHOLD = 5;
export const RECOVERY_CHECK_INTERVAL = 60 * 1000; // 1 minute

// Protection state defaults
export const DEFAULT_PROTECTION_METRICS = {
  intensity: 0.7,
  stability: 0.8,
  conductivity: 0.6,
  safety: 0.9,
  resilience: 0.8,
  recovery: 0.7
} as const;

export const DEFAULT_RECOVERY_PLAN = {
  active: false,
  startTime: Date.now(),
  duration: 15 * 60 * 1000, // 15 minutes
  steps: []
} as const;

export const DEFAULT_PROTECTION_STATE = {
  id: crypto.randomUUID(),
  type: 'protection',
  metrics: DEFAULT_PROTECTION_METRICS,
  violations: [],
  recoveryPlan: DEFAULT_RECOVERY_PLAN,
  timestamp: Date.now()
} as const; 