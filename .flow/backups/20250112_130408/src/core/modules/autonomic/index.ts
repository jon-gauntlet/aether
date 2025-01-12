export * from './types';

// Autonomic-specific constants
export const MIN_ADAPTABILITY_THRESHOLD = 0.3;
export const MIN_RESILIENCE_THRESHOLD = 0.4;
export const MIN_EFFICIENCY_THRESHOLD = 0.5;
export const PATTERN_DETECTION_INTERVAL = 60 * 1000; // 1 minute

// Autonomic state defaults
export const DEFAULT_AUTONOMIC_METRICS = {
  intensity: 0.7,
  stability: 0.8,
  conductivity: 0.6,
  adaptability: 0.8,
  resilience: 0.7,
  efficiency: 0.9
} as const;

export const DEFAULT_AUTONOMIC_STATE = {
  id: crypto.randomUUID(),
  type: 'autonomic',
  metrics: DEFAULT_AUTONOMIC_METRICS,
  patterns: [],
  responses: [],
  timestamp: Date.now()
} as const;

// Response effectiveness thresholds
export const EFFECTIVENESS_THRESHOLDS = {
  INEFFECTIVE: 0.3,
  MODERATE: 0.5,
  EFFECTIVE: 0.7,
  OPTIMAL: 0.9
} as const;

// Pattern confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  LOW: 0.3,
  MEDIUM: 0.5,
  HIGH: 0.7,
  VERY_HIGH: 0.9
} as const; 