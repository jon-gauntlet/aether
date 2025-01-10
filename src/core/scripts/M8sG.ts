// Core Types
export const NaturalFlowTypes = ['natural', 'guided', 'autonomous'] as const;
export type NaturalFlowType = (typeof NaturalFlowTypes)[number];

export const PresenceTypes = ['deep', 'light', 'surface'] as const;
export type PresenceType = (typeof PresenceTypes)[number];

export type DevelopmentPhase = 'initial' | 'emerging' | 'stable' | 'optimizing' | 'protecting';

export const ConnectionTypes = ['direct', 'indirect', 'resonant'] as const;
export type ConnectionType = (typeof ConnectionTypes)[number];

export const ProtectionTypes = ['natural', 'enhanced', 'autonomous'] as const;
export type ProtectionType = (typeof ProtectionTypes)[number];

export interface Wave {
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Field {
  center: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  strength: number;
  coherence: number;
  stability: number;
  waves: Wave[];
}

export interface Resonance {
  frequency: number;
  amplitude: number;
  phase: number;
  coherence: number;
}

export interface Protection {
  level: number;
  type: ProtectionType;
  strength: number;
  resilience: number;
  adaptability: number;
  field: Field;
  natural: boolean;
}

export interface BaseMetrics {
  intensity: number;
  coherence: number;
  resonance: number;
  presence: number;
  harmony: number;
  rhythm: number;
}

export interface FlowMetrics extends BaseMetrics {
  depth: number;
  clarity: number;
  stability: number;
  focus: number;
  energy: number;
  quality: number;
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  strength: number;
  evolution: {
    stage: number;
    history: string[];
    lastEvolved: string;
    entropyLevel: number;
    metrics?: EvolutionMetrics;
  };
  metadata?: {
    tags: string[];
    category: string;
    priority: number;
  };
}

export interface EvolutionMetrics {
  adaptability: number;
  resilience: number;
  coherence: number;
  stability: number;
}

export interface FlowState {
  id: string;
  type: NaturalFlowType;
  metrics: FlowMetrics;
  protection: Protection;
  patterns: Pattern[];
  timestamp: number;
}

export interface Flow {
  id: string;
  type: NaturalFlowType;
  metrics: FlowMetrics;
  protection: Protection;
  patterns: Pattern[];
  timestamp: number;
}

export interface FlowTransition {
  from: FlowState;
  to: FlowState;
  timestamp: number;
  duration: number;
  quality: number;
}

export interface FlowSpace {
  id: string;
  flows: Flow[];
  metrics: FlowMetrics;
  protection: Protection;
  patterns: Pattern[];
  timestamp: number;
}

export interface MindSpace {
  id: string;
  type: string;
  flows: Flow[];
  connections: Connection[];
}

export interface Connection {
  source: string;
  target: string;
  strength: number;
  type: ConnectionType;
  metrics: FlowMetrics;
}

export interface ConsciousnessState {
  id: string;
  type: string;
  spaces: string[];
  metrics: FlowMetrics;
  protection: Protection;
  resonance: Resonance;
  patterns: Pattern[];
}

export interface FlowContext {
  id: string;
  type: NaturalFlowType;
  presence: PresenceType;
  metrics: FlowMetrics;
  protection: Protection;
  patterns: Pattern[];
  timestamp: number;
}

export interface HyperfocusMetrics extends FlowMetrics {
  intensity: number;
  duration: number;
  contextRetention: number;
}

export interface EnhancedEnergyState {
  id: string;
  level: number;
  capacity: number;
  protection: number;
  timestamp: number;
  metrics: FlowMetrics;
  resonance: Resonance;
  field: Field;
}

export interface ContextState {
  id: string;
  type: string;
  depth: number;
  presence: string;
  flow: string;
  metrics: FlowMetrics;
  protection: Protection;
  timestamp: number;
}

export interface AutonomicState {
  energy: EnhancedEnergyState;
  flow: FlowState;
  context: ContextState;
  protection: Protection;
  pattern: Pattern;
}

export interface IntegrationMetrics {
  harmony: number;
  presence: number;
  clarity: number;
  resonance: number;
  coherence: number;
  alignment: number;
}

export interface SystemState {
  metrics: IntegrationMetrics;
  timestamp: number;
  cycle: CycleType;
}

export type CycleType = 'harmony' | 'reflection' | 'restoration' | 'flow';

export interface TypeValidationResult {
  isValid: boolean;
  errors: string[];
  path: string[];
  energy: number;
  requiredProbability?: number;
  coherence?: number;
  pattern?: string;
  context?: string[];
  flow_state?: {
    depth: number;
    protection: number;
    natural_alignment: number;
  };
  hyperfocus_metrics?: {
    depth: number;
    duration: number;
    energy_efficiency: number;
    context_retention: number;
  };
  developmentPhase?: DevelopmentPhase;
}

export interface SessionMetrics extends FlowMetrics {
  duration: number;
  intensity: number;
  focus: number;
  progress: number;
}

export interface ValidationMetrics extends FlowMetrics {
  accuracy: number;
  confidence: number;
  reliability: number;
  consistency: number;
}

export interface IndexStats {
  totalPatterns: number;
  activePatterns: number;
  averageQuality: number;
  lastUpdated: number;
}

export interface PatternIndex {
  id: string;
  patterns: Pattern[];
  stats: IndexStats;
  lastUpdated: number;
}