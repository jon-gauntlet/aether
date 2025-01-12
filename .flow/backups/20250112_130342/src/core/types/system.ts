import { z } from 'zod';

// Schema definitions
export const BaseMetricsSchema = z.object({
  stability: z.number().min(0).max(1),
  coherence: z.number().min(0).max(1),
  resonance: z.number().min(0).max(1),
  quality: z.number().min(0).max(1),
});

export const FieldSchema = z.object({
  center: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  radius: z.number(),
  strength: z.number().min(0).max(1),
  coherence: z.number().min(0).max(1),
  stability: z.number().min(0).max(1),
  resonance: z.object({
    primary: z.object({
      frequency: z.number(),
      amplitude: z.number(),
      phase: z.number(),
    }),
    harmonics: z.array(z.object({
      frequency: z.number(),
      amplitude: z.number(),
      phase: z.number(),
    })),
    coherence: z.number().min(0).max(1),
    stability: z.number().min(0).max(1),
  }),
  protection: z.object({
    level: z.number().min(0),
    type: z.enum(['natural', 'enhanced', 'autonomous', 'standard']),
    strength: z.number().min(0).max(1),
    resilience: z.number().min(0).max(1),
    adaptability: z.number().min(0).max(1),
    natural: z.boolean(),
    field: z.object({
      center: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }),
      radius: z.number(),
      strength: z.number().min(0).max(1),
      coherence: z.number().min(0).max(1),
      stability: z.number().min(0).max(1),
    }).optional(),
  }),
});

export const FlowStateSchema = z.object({
  type: z.enum(['FLOW', 'FOCUS', 'HYPERFOCUS', 'RECOVERING', 'RESTING', 'PROTECTED']),
  metrics: z.object({
    velocity: z.number().min(0).max(1),
    momentum: z.number().min(0).max(1),
    resistance: z.number().min(0).max(1),
    conductivity: z.number().min(0).max(1),
    focus: z.number().min(0).max(1),
    energy: z.number().min(0).max(1),
    clarity: z.number().min(0).max(1),
    quality: z.number().min(0).max(1),
  }),
  active: z.boolean(),
  intensity: z.number().min(0).max(1),
  duration: z.number(),
  timestamp: z.number(),
});

export const PatternSchema = z.object({
  id: z.string(),
  type: z.string(),
  strength: z.number().min(0).max(1),
  resonance: z.number().min(0).max(1),
  nodes: z.array(z.object({
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    type: z.string(),
    strength: z.number().min(0).max(1),
  })),
  connections: z.array(z.object({
    source: z.number(),
    target: z.number(),
    strength: z.number().min(0).max(1),
  })),
  activations: z.number(),
  metrics: z.object({
    stability: z.object({
      current: z.number().min(0).max(1),
      history: z.array(z.number().min(0).max(1)),
    }),
    coherence: z.object({
      current: z.number().min(0).max(1),
      history: z.array(z.number().min(0).max(1)),
    }),
    harmony: z.number().min(0).max(1),
    evolution: z.object({
      current: z.number().min(0).max(1),
      history: z.array(z.number().min(0).max(1)),
    }),
    quality: z.number().min(0).max(1),
  }),
});

export const ConsciousnessSchema = z.object({
  currentState: z.enum(['FLOW', 'FOCUS', 'HYPERFOCUS', 'RECOVERING', 'RESTING', 'PROTECTED']),
  flowSpace: z.object({
    dimensions: z.number().min(0),
    capacity: z.number().min(0),
    utilization: z.number().min(0).max(1),
    stability: z.number().min(0).max(1),
    coherence: z.number().min(0).max(1),
    resonance: z.number().min(0).max(1),
    fields: z.array(z.lazy(() => FieldSchema)),
    boundaries: z.array(z.any()),
  }),
  protection: z.object({
    level: z.number().min(0).max(1),
    integrity: z.number().min(0).max(1),
    adaptability: z.number().min(0).max(1),
  }),
  metrics: z.object({
    focus: z.number().min(0).max(1),
    clarity: z.number().min(0).max(1),
    presence: z.number().min(0).max(1),
  }),
  fields: z.array(z.lazy(() => FieldSchema)),
  lastTransition: z.number(),
  stateHistory: z.array(z.lazy(() => FlowStateSchema)),
});

// Base type definitions using Zod schemas
export type FlowStateType = z.infer<typeof FlowStateSchema>;
export type FieldType = z.infer<typeof FieldSchema>;
export type PatternType = z.infer<typeof PatternSchema>;
export type ConsciousnessStateType = z.infer<typeof ConsciousnessSchema>;

// Export schemas
export const schemas = {
  BaseMetrics: BaseMetricsSchema,
  Field: FieldSchema,
  Consciousness: ConsciousnessSchema,
  Pattern: PatternSchema,
} as const;

// Type guards
export const isField = (value: unknown): value is FieldType => {
  return FieldSchema.safeParse(value).success;
};

export const isConsciousnessState = (value: unknown): value is ConsciousnessStateType => {
  return ConsciousnessSchema.safeParse(value).success;
};

export const isPattern = (value: unknown): value is PatternType => {
  return PatternSchema.safeParse(value).success;
};

// Energy interface
export interface Energy {
  level: number;
  frequency: number;
  coherence: number;
}

// Simplified interfaces for component use
export interface FlowState extends FlowStateType {
  spaces?: {
    id: string;
    name: string;
    energy: number;
  }[];
  patterns?: {
    id: string;
    name: string;
    strength: number;
  }[];
  resonance?: {
    frequency: number;
    amplitude: number;
    phase: number;
  };
}

export interface Field {
  id: string;
  name: string;
  energy: Energy;
  center: { x: number; y: number; z: number };
  radius: number;
  strength: number;
  coherence: number;
  stability: number;
  resonance: {
    primary: { frequency: number; amplitude: number; phase: number };
    harmonics: { frequency: number; amplitude: number; phase: number }[];
    coherence: number;
    stability: number;
  };
  protection: {
    level: number;
    type: 'natural' | 'enhanced' | 'autonomous' | 'standard';
    strength: number;
    resilience: number;
    adaptability: number;
    natural: boolean;
    field?: {
      center: { x: number; y: number; z: number };
      radius: number;
      strength: number;
      coherence: number;
      stability: number;
    };
  };
}

export interface Pattern extends PatternType {
  name: string;
  frequency?: number;
}

// Factory functions
export const createDefaultEnergy = (): Energy => ({
  level: 0.7,
  frequency: 0.5,
  coherence: 0.8
});

export const createDefaultFlowState = (): FlowState => ({
  type: 'FLOW',
  metrics: {
    velocity: 0.7,
    momentum: 0.8,
    resistance: 0.2,
    conductivity: 0.9,
    focus: 0.8,
    energy: 0.7,
    clarity: 0.8,
    quality: 0.9
  },
  active: true,
  intensity: 0.8,
  duration: 0,
  timestamp: Date.now()
});

export const createDefaultField = (): Field => ({
  id: 'default-field',
  name: 'Default Field',
  energy: createDefaultEnergy(),
  center: { x: 0, y: 0, z: 0 },
  radius: 1,
  strength: 0.85,
  coherence: 0.9,
  stability: 0.88,
  resonance: {
    primary: { frequency: 1.618, amplitude: 0.8, phase: 0 },
    harmonics: [],
    coherence: 0.9,
    stability: 0.85,
  },
  protection: {
    level: 1,
    type: 'natural',
    strength: 0.9,
    resilience: 0.85,
    adaptability: 0.9,
    natural: true,
    field: {
      center: { x: 0, y: 0, z: 0 },
      radius: 1,
      strength: 0.9,
      coherence: 0.85,
      stability: 0.9,
    },
  },
});

export const createDefaultPattern = (): Pattern => ({
  ...createDefaultPatternBase(),
  name: 'Default Pattern',
  frequency: 0.5
});

// Internal base creators (private)
const createDefaultFieldBase = (): FieldType => ({
  center: { x: 0, y: 0, z: 0 },
  radius: 1,
  strength: 0.85,
  coherence: 0.9,
  stability: 0.88,
  resonance: {
    primary: { frequency: 1.618, amplitude: 0.8, phase: 0 },
    harmonics: [],
    coherence: 0.9,
    stability: 0.85,
  },
  protection: {
    level: 1,
    type: 'natural',
    strength: 0.9,
    resilience: 0.85,
    adaptability: 0.9,
    natural: true,
    field: {
      center: { x: 0, y: 0, z: 0 },
      radius: 1,
      strength: 0.9,
      coherence: 0.85,
      stability: 0.9,
    },
  },
});

const createDefaultPatternBase = (): PatternType => ({
  id: '1',
  type: 'development',
  strength: 0.85,
  resonance: 0.9,
  nodes: [
    { position: { x: -0.5, y: -0.5 }, type: 'core', strength: 0.9 },
    { position: { x: 0.5, y: -0.5 }, type: 'processor', strength: 0.85 },
    { position: { x: 0, y: 0.5 }, type: 'output', strength: 0.8 },
  ],
  connections: [
    { source: 0, target: 1, strength: 0.9 },
    { source: 1, target: 2, strength: 0.85 },
    { source: 0, target: 2, strength: 0.8 },
  ],
  activations: 5,
  metrics: {
    stability: {
      current: 0.88,
      history: [0.85, 0.86, 0.87, 0.88],
    },
    coherence: {
      current: 0.9,
      history: [0.87, 0.88, 0.89, 0.9],
    },
    harmony: 0.92,
    evolution: {
      current: 0.85,
      history: [0.82, 0.83, 0.84, 0.85],
    },
    quality: 0.89,
  },
}); 

// Runtime validation helpers
export const validateFlowState = (state: unknown): state is FlowState => {
  const result = FlowStateSchema.safeParse(state);
  if (!result.success) {
    console.error('Flow state validation failed:', result.error);
    return false;
  }
  return true;
};

export const validateField = (field: unknown): field is Field => {
  const result = FieldSchema.safeParse(field);
  if (!result.success) {
    console.error('Field validation failed:', result.error);
    return false;
  }
  return true;
};

export const validatePattern = (pattern: unknown): pattern is Pattern => {
  const result = PatternSchema.safeParse(pattern);
  if (!result.success) {
    console.error('Pattern validation failed:', result.error);
    return false;
  }
  return true;
};

// Flow state transition validation
export const validateFlowTransition = (from: FlowState, to: FlowState): boolean => {
  // Validate basic state shape
  if (!validateFlowState(from) || !validateFlowState(to)) {
    return false;
  }

  // Check energy conservation
  if (to.metrics.energy < from.metrics.energy * 0.5) {
    console.error('Energy loss too high in transition');
    return false;
  }

  // Check momentum conservation
  if (to.metrics.momentum < from.metrics.momentum * 0.7) {
    console.warn('Significant momentum loss in transition');
  }

  // Validate state sequence
  const validTransitions: Record<FlowState['type'], FlowState['type'][]> = {
    'FLOW': ['FLOW', 'FOCUS', 'HYPERFOCUS', 'RESTING'],
    'FOCUS': ['FLOW', 'HYPERFOCUS', 'RESTING'],
    'HYPERFOCUS': ['FLOW', 'FOCUS', 'RECOVERING'],
    'RECOVERING': ['FLOW', 'RESTING'],
    'RESTING': ['FLOW', 'FOCUS'],
    'PROTECTED': ['FLOW', 'FOCUS', 'RESTING'],
  };

  if (!validTransitions[from.type].includes(to.type)) {
    console.error(`Invalid state transition: ${from.type} -> ${to.type}`);
    return false;
  }

  return true;
};

// System invariant checks
export const checkSystemInvariants = (state: FlowState): boolean => {
  // Energy bounds
  if (state.metrics.energy < 0 || state.metrics.energy > 1) {
    console.error('Energy out of bounds');
    return false;
  }

  // Momentum conservation
  if (state.metrics.momentum < 0 || state.metrics.momentum > 1) {
    console.error('Momentum out of bounds');
    return false;
  }

  // Flow coherence
  if (state.metrics.clarity * state.metrics.focus < 0.2) {
    console.warn('Low flow coherence detected');
  }

  // Pattern stability
  if (state.patterns?.some(p => p.strength < 0.3)) {
    console.warn('Unstable patterns detected');
  }

  return true;
};

// Flow state optimization
export interface FlowOptimization {
  type: 'SPEED' | 'DEPTH' | 'STABILITY' | 'RECOVERY';
  intensity: number;
  duration: number;
}

// Flow detection thresholds
const FLOW_THRESHOLDS = {
  HYPERFOCUS: {
    focus: 0.85,
    clarity: 0.8,
    energy: 0.7,
    momentum: 0.8,
    minDuration: 1000 * 60 * 20, // 20 minutes
  },
  FLOW: {
    focus: 0.7,
    clarity: 0.7,
    energy: 0.6,
    momentum: 0.6,
    minDuration: 1000 * 60 * 5, // 5 minutes
  },
  RECOVERY: {
    energy: 0.3,
    momentum: 0.4,
    maxDuration: 1000 * 60 * 15, // 15 minutes
  }
} as const;

// Flow state detection
export const detectFlowState = (
  current: FlowState,
  history: FlowState[] = []
): { type: FlowState['type']; confidence: number; recommendation?: FlowOptimization } => {
  const { metrics, duration } = current;
  const lastState = history[history.length - 1];

  // Hyperfocus detection
  if (
    metrics.focus >= FLOW_THRESHOLDS.HYPERFOCUS.focus &&
    metrics.clarity >= FLOW_THRESHOLDS.HYPERFOCUS.clarity &&
    metrics.energy >= FLOW_THRESHOLDS.HYPERFOCUS.energy &&
    metrics.momentum >= FLOW_THRESHOLDS.HYPERFOCUS.momentum &&
    duration >= FLOW_THRESHOLDS.HYPERFOCUS.minDuration
  ) {
    return {
      type: 'HYPERFOCUS',
      confidence: 0.95,
      recommendation: {
        type: 'DEPTH',
        intensity: 0.9,
        duration: 1000 * 60 * 45, // 45 minutes
      }
    };
  }

  // Flow detection
  if (
    metrics.focus >= FLOW_THRESHOLDS.FLOW.focus &&
    metrics.clarity >= FLOW_THRESHOLDS.FLOW.clarity &&
    metrics.energy >= FLOW_THRESHOLDS.FLOW.energy &&
    metrics.momentum >= FLOW_THRESHOLDS.FLOW.momentum
  ) {
    return {
      type: 'FLOW',
      confidence: 0.85,
      recommendation: {
        type: 'SPEED',
        intensity: 0.8,
        duration: 1000 * 60 * 30, // 30 minutes
      }
    };
  }

  // Recovery detection
  if (
    metrics.energy <= FLOW_THRESHOLDS.RECOVERY.energy ||
    metrics.momentum <= FLOW_THRESHOLDS.RECOVERY.momentum
  ) {
    return {
      type: 'RECOVERING',
      confidence: 0.75,
      recommendation: {
        type: 'RECOVERY',
        intensity: 0.4,
        duration: 1000 * 60 * 10, // 10 minutes
      }
    };
  }

  // Flow state optimization
  return optimizeFlowState(current, lastState);
};

// Flow state optimization
const optimizeFlowState = (
  current: FlowState,
  last?: FlowState
): { type: FlowState['type']; confidence: number; recommendation?: FlowOptimization } => {
  const { metrics } = current;

  // Check for potential flow entry
  if (metrics.focus >= 0.6 && metrics.energy >= 0.7) {
    return {
      type: 'FOCUS',
      confidence: 0.7,
      recommendation: {
        type: 'SPEED',
        intensity: 0.7,
        duration: 1000 * 60 * 15, // 15 minutes
      }
    };
  }

  // Check for needed rest
  if (metrics.energy <= 0.4 || (last?.metrics.energy || 0) - metrics.energy >= 0.3) {
    return {
      type: 'RESTING',
      confidence: 0.8,
      recommendation: {
        type: 'RECOVERY',
        intensity: 0.3,
        duration: 1000 * 60 * 5, // 5 minutes
      }
    };
  }

  // Default to protected state
  return {
    type: 'PROTECTED',
    confidence: 0.6,
    recommendation: {
      type: 'STABILITY',
      intensity: 0.5,
      duration: 1000 * 60 * 5, // 5 minutes
    }
  };
};

// Flow interruption prevention
export const shouldPreventInterruption = (state: FlowState): boolean => {
  // Always prevent in hyperfocus
  if (state.type === 'HYPERFOCUS') return true;

  // Prevent in flow if momentum is high
  if (state.type === 'FLOW' && state.metrics.momentum >= 0.8) return true;

  // Prevent if we're building up to flow
  if (state.type === 'FOCUS' && 
      state.metrics.focus >= 0.7 && 
      state.metrics.momentum >= 0.6) return true;

  return false;
};

// Flow state recovery
export const generateRecoveryPath = (
  current: FlowState,
  target: FlowState['type']
): FlowOptimization[] => {
  const recoveryPaths: Record<FlowState['type'], FlowOptimization[]> = {
    HYPERFOCUS: [
      { type: 'FOCUS', intensity: 0.7, duration: 1000 * 60 * 10 },
      { type: 'SPEED', intensity: 0.8, duration: 1000 * 60 * 15 },
      { type: 'DEPTH', intensity: 0.9, duration: 1000 * 60 * 20 }
    ],
    FLOW: [
      { type: 'STABILITY', intensity: 0.6, duration: 1000 * 60 * 5 },
      { type: 'SPEED', intensity: 0.7, duration: 1000 * 60 * 10 }
    ],
    FOCUS: [
      { type: 'STABILITY', intensity: 0.5, duration: 1000 * 60 * 5 }
    ],
    RECOVERING: [
      { type: 'RECOVERY', intensity: 0.3, duration: 1000 * 60 * 5 },
      { type: 'STABILITY', intensity: 0.4, duration: 1000 * 60 * 5 }
    ],
    RESTING: [
      { type: 'RECOVERY', intensity: 0.2, duration: 1000 * 60 * 5 }
    ],
    PROTECTED: [
      { type: 'STABILITY', intensity: 0.4, duration: 1000 * 60 * 5 }
    ]
  };

  return recoveryPaths[target] || [];
}; 