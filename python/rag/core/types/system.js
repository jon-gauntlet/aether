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

// Export schemas
export const schemas = {
  BaseMetrics: BaseMetricsSchema,
  Field: FieldSchema,
  Consciousness: ConsciousnessSchema,
  Pattern: PatternSchema,
};

// Type guards
export const isField = (value) => {
  return FieldSchema.safeParse(value).success;
};

export const isConsciousnessState = (value) => {
  return ConsciousnessSchema.safeParse(value).success;
};

export const isPattern = (value) => {
  return PatternSchema.safeParse(value).success;
};

// Factory functions
export const createDefaultEnergy = () => ({
  level: 0.7,
  frequency: 0.5,
  coherence: 0.8
});

export const createDefaultFlowState = () => ({
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

export const createDefaultField = () => ({
  id: 'default-field',
  name: 'Default Field',
  energy: createDefaultEnergy(),
  center: { x: 0, y: 0, z: 0 },
  radius: 10,
  strength: 0.8,
  coherence: 0.7,
  stability: 0.9,
  resonance: {
    primary: { frequency: 0.5, amplitude: 0.7, phase: 0 },
    harmonics: [
      { frequency: 1.0, amplitude: 0.3, phase: Math.PI / 4 },
      { frequency: 2.0, amplitude: 0.2, phase: Math.PI / 2 }
    ],
    coherence: 0.8,
    stability: 0.9
  },
  protection: {
    level: 1,
    type: 'natural',
    strength: 0.8,
    resilience: 0.7,
    adaptability: 0.9,
    natural: true,
    field: {
      center: { x: 0, y: 0, z: 0 },
      radius: 12,
      strength: 0.9,
      coherence: 0.8,
      stability: 0.9
    }
  }
});

export const createDefaultPattern = () => ({
  id: 'default-pattern',
  name: 'Default Pattern',
  type: 'natural',
  strength: 0.8,
  resonance: 0.7,
  frequency: 0.5,
  nodes: [
    { position: { x: 0, y: 0 }, type: 'core', strength: 0.9 },
    { position: { x: 1, y: 1 }, type: 'support', strength: 0.7 },
    { position: { x: -1, y: 1 }, type: 'support', strength: 0.7 }
  ],
  connections: [
    { source: 0, target: 1, strength: 0.8 },
    { source: 0, target: 2, strength: 0.8 },
    { source: 1, target: 2, strength: 0.6 }
  ],
  activations: 0,
  metrics: {
    stability: {
      current: 0.8,
      history: [0.7, 0.75, 0.8]
    },
    coherence: {
      current: 0.7,
      history: [0.6, 0.65, 0.7]
    },
    harmony: 0.75,
    evolution: {
      current: 0.6,
      history: [0.5, 0.55, 0.6]
    },
    quality: 0.8
  }
});

export const createDefaultConsciousness = () => ({
  currentState: 'FLOW',
  flowSpace: {
    dimensions: 3,
    capacity: 100,
    utilization: 0.7,
    stability: 0.8,
    coherence: 0.7,
    resonance: 0.6,
    fields: [],
    boundaries: []
  },
  protection: {
    level: 0.8,
    integrity: 0.9,
    adaptability: 0.7
  },
  metrics: {
    focus: 0.8,
    clarity: 0.7,
    presence: 0.9
  },
  fields: [],
  lastTransition: Date.now(),
  stateHistory: []
}); 