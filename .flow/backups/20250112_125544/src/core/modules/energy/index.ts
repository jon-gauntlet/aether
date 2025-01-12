export * from './types';

// Energy-specific constants
export const MIN_ENERGY_THRESHOLD = 0.2;
export const OPTIMAL_ENERGY_LEVEL = 0.8;
export const RECOVERY_RATE = 0.1; // per hour
export const DEPLETION_RATE = 0.05; // per hour

// Energy state defaults
export const DEFAULT_ENERGY_METRICS = {
  intensity: 0.6,
  stability: 0.7,
  conductivity: 0.8,
  mental: 0.9,
  physical: 0.8,
  emotional: 0.7
} as const;

export const DEFAULT_ENERGY_RESERVES = {
  mental: 0.8,
  physical: 0.7,
  emotional: 0.9,
  lastReplenished: Date.now()
} as const;

export const DEFAULT_ENERGY_STATE = {
  id: crypto.randomUUID(),
  type: 'energy',
  metrics: DEFAULT_ENERGY_METRICS,
  history: [],
  reserves: DEFAULT_ENERGY_RESERVES,
  timestamp: Date.now()
} as const;

// Energy level thresholds
export const ENERGY_THRESHOLDS = {
  CRITICAL: 0.2,
  LOW: 0.4,
  MEDIUM: 0.6,
  HIGH: 0.8
} as const; 