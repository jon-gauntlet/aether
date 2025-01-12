import { z } from 'zod';

// Base Metrics Schema
const BaseMetricsSchema = z.object({
  stability: z.number().min(0).max(1),
  coherence: z.number().min(0).max(1),
  resonance: z.number().min(0).max(1),
  quality: z.number().min(0).max(1),
});

// Field Schema
const FieldSchema: z.ZodType<any> = z.object({
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

// Flow State Type
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

export type FlowState = z.infer<typeof FlowStateSchema>;

// Consciousness Schema
const ConsciousnessSchema = z.object({
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
  stateHistory: z.array(FlowStateSchema),
});

// Pattern Schema
const PatternSchema = z.object({
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

// Export types
export type BaseMetrics = z.infer<typeof BaseMetricsSchema>;
export type Field = z.infer<typeof FieldSchema>;
export type ConsciousnessState = z.infer<typeof ConsciousnessSchema>;
export type Pattern = z.infer<typeof PatternSchema>;

// Export schemas
export const schemas = {
  BaseMetrics: BaseMetricsSchema,
  Field: FieldSchema,
  Consciousness: ConsciousnessSchema,
  Pattern: PatternSchema,
} as const;

// Type guards
export const isField = (value: unknown): value is Field => {
  return FieldSchema.safeParse(value).success;
};

export const isConsciousnessState = (value: unknown): value is ConsciousnessState => {
  return ConsciousnessSchema.safeParse(value).success;
};

export const isPattern = (value: unknown): value is Pattern => {
  return PatternSchema.safeParse(value).success;
};

// Default state creators
export const createDefaultField = (): Field => ({
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

export const createDefaultConsciousness = (): ConsciousnessState => ({
  currentState: 'RESTING',
  flowSpace: {
    dimensions: 3,
    capacity: 100,
    utilization: 0.5,
    stability: 0.9,
    coherence: 0.85,
    resonance: 0.88,
    fields: [],
    boundaries: [],
  },
  protection: {
    level: 0.9,
    integrity: 0.85,
    adaptability: 0.9,
  },
  metrics: {
    focus: 0.85,
    clarity: 0.9,
    presence: 0.88,
  },
  fields: [],
  lastTransition: Date.now(),
  stateHistory: [{
    active: true,
    type: 'RESTING',
    intensity: 0.5,
    duration: 0,
    metrics: {
      velocity: 0.8,
      momentum: 0.8,
      resistance: 0.2,
      conductivity: 0.8,
      focus: 0.9,
      energy: 0.85,
      clarity: 0.9,
      quality: 0.85,
    },
    timestamp: Date.now(),
  }],
});

export const createDefaultPattern = (): Pattern => ({
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