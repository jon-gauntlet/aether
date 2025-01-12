export * from './types';

// Flow-specific constants
export const MIN_FLOW_DURATION = 15 * 60 * 1000; // 15 minutes
export const MAX_FLOW_DURATION = 3 * 60 * 60 * 1000; // 3 hours
export const FLOW_BREAK_INTERVAL = 45 * 60 * 1000; // 45 minutes
export const MIN_PROTECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Flow state defaults
export const DEFAULT_FLOW_METRICS = {
  intensity: 0.5,
  stability: 0.7,
  conductivity: 0.6,
  focus: 0.8,
  energy: 0.9,
  coherence: 0.7
} as const;

export const DEFAULT_FLOW_PROTECTION = {
  active: true,
  level: 'MEDIUM',
  triggers: [],
  lastUpdate: Date.now()
} as const;

export const DEFAULT_FLOW_STATE = {
  id: crypto.randomUUID(),
  type: 'flow',
  metrics: DEFAULT_FLOW_METRICS,
  history: [],
  protection: DEFAULT_FLOW_PROTECTION,
  timestamp: Date.now()
} as const; 