export * from './types';

// Space-specific constants
export const MIN_HARMONY_THRESHOLD = 0.4;
export const MIN_RESONANCE_THRESHOLD = 0.4;
export const MIN_COHERENCE_THRESHOLD = 0.5;
export const FIELD_UPDATE_INTERVAL = 1000; // 1 second

// Space state defaults
export const DEFAULT_SPACE_METRICS = {
  intensity: 0.7,
  stability: 0.8,
  conductivity: 0.6,
  harmony: 0.8,
  resonance: 0.7,
  coherence: 0.9
} as const;

export const DEFAULT_SPACE_BOUNDARIES = {
  permeability: 0.5,
  flexibility: 0.7,
  resilience: 0.8,
  lastAdjusted: Date.now()
} as const;

export const DEFAULT_SPACE_STATE = {
  id: crypto.randomUUID(),
  type: 'space',
  metrics: DEFAULT_SPACE_METRICS,
  fields: [],
  boundaries: DEFAULT_SPACE_BOUNDARIES,
  timestamp: Date.now()
} as const;

// Field strength thresholds
export const FIELD_THRESHOLDS = {
  WEAK: 0.3,
  MODERATE: 0.5,
  STRONG: 0.7,
  INTENSE: 0.9
} as const;

// Boundary permeability thresholds
export const PERMEABILITY_THRESHOLDS = {
  CLOSED: 0.2,
  SELECTIVE: 0.4,
  PERMEABLE: 0.6,
  OPEN: 0.8
} as const; 