export * from './types';

// Consciousness-specific constants
export const MIN_AWARENESS_THRESHOLD = 0.3;
export const MIN_PRESENCE_THRESHOLD = 0.4;
export const MIN_CLARITY_THRESHOLD = 0.4;
export const PATTERN_DETECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Consciousness state defaults
export const DEFAULT_CONSCIOUSNESS_METRICS = {
  intensity: 0.7,
  stability: 0.8,
  conductivity: 0.6,
  awareness: 0.8,
  presence: 0.7,
  clarity: 0.9
} as const;

export const DEFAULT_CONSCIOUSNESS_CONTEXT = {
  focus: 'neutral',
  depth: 0.7,
  quality: 0.8,
  timestamp: Date.now()
} as const;

export const DEFAULT_CONSCIOUSNESS_STATE = {
  id: crypto.randomUUID(),
  type: 'consciousness',
  metrics: DEFAULT_CONSCIOUSNESS_METRICS,
  patterns: [],
  context: DEFAULT_CONSCIOUSNESS_CONTEXT,
  timestamp: Date.now()
} as const;

// Pattern strength thresholds
export const PATTERN_THRESHOLDS = {
  WEAK: 0.3,
  MODERATE: 0.5,
  STRONG: 0.7,
  DOMINANT: 0.9
} as const; 