import { z } from 'zod';

// Core natural system types
export const NaturalSystemSchema = z.object({
  cognitiveLoad: z.number().min(0).max(1),
  attentionCost: z.number().min(0).max(1),
  currentState: z.enum(['DEEP', 'FLOW', 'SOCIAL', 'RECOVERY']),
  energyField: z.lazy(() => EnergyFieldSchema),
  boundaries: z.array(z.lazy(() => NaturalBoundarySchema))
});

export const EnergyFieldSchema = z.object({
  strength: z.number().min(0).max(1),
  resonance: z.number().min(0).max(1),
  frequency: z.number(),
  patterns: z.array(z.lazy(() => PatternSchema))
});

export const SpaceSchema = z.object({
  type: z.enum(['SANCTUARY', 'WORKSHOP', 'GARDEN', 'COMMONS', 'LIBRARY', 'RECOVERY']),
  energy: z.lazy(() => EnergyFieldSchema),
  atmosphere: z.object({
    lighting: z.number().min(0).max(1),
    sound: z.number().min(0).max(1),
    activity: z.number().min(0).max(1),
    focus: z.number().min(0).max(1)
  }),
  inhabitants: z.array(z.lazy(() => PresenceSchema)),
  activities: z.array(z.lazy(() => ActivitySchema)),
  resonance: z.lazy(() => ResonanceFieldSchema)
});

// AI-ready interfaces
export interface AIAwareSystem {
  // Natural system core
  natural: z.infer<typeof NaturalSystemSchema>;
  
  // AI capabilities
  awareness: {
    patterns: Pattern[];
    context: Context;
    understanding: Understanding;
  };
  
  // Learning
  adaptation: {
    patterns: AdaptivePattern[];
    history: LearningHistory;
    evolution: EvolutionPath;
  };
}

export interface AIEnhancedSpace extends z.infer<typeof SpaceSchema> {
  // AI space features
  consciousness: {
    collective: CollectiveAwareness;
    individual: Map<string, IndividualAwareness>;
    emergence: EmergentPatterns;
  };
  
  // Natural language
  communication: {
    understanding: LanguageUnderstanding;
    generation: NaturalGeneration;
    context: DeepContext;
  };
}

// Pattern recognition for AI
export interface Pattern {
  type: string;
  strength: number;
  confidence: number;
  evolution: Evolution[];
  context: Context;
}

export interface Context {
  immediate: any;
  historical: any;
  predicted: any;
  confidence: number;
}

export interface Understanding {
  depth: number;
  breadth: number;
  confidence: number;
  gaps: Gap[];
}

// Type exports
export type NaturalSystem = z.infer<typeof NaturalSystemSchema>;
export type EnergyField = z.infer<typeof EnergyFieldSchema>;
export type Space = z.infer<typeof SpaceSchema>;

// Utility types
export type Evolution = {
  from: Pattern;
  to: Pattern;
  confidence: number;
  timestamp: number;
};

export type Gap = {
  type: string;
  severity: number;
  context: Context;
}; 