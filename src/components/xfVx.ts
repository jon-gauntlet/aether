import { Observable } from 'rxjs';

export type EnergyType = 'deep' | 'steady' | 'reflective' | 'analytical';
export type FlowType = 'natural' | 'guided' | 'protected';

export interface Energy {
  level: number;
  type: EnergyType;
  flow: FlowType;
}

export interface Context {
  current: string;
  depth: number;
  patterns: string[];
  protection?: number;
  protectedPatterns?: string[];
  protectedStates?: string[];
}

export interface Protection {
  depth: number;
  patterns: string[];
  states: string[];
}

export interface AutonomicState {
  context: Context;
  energy: Energy;
  protection: Protection;
}

export interface AutonomicFlow {
  context: Context;
  energy: Energy;
  protection: Protection;
}

export interface UseAutonomicDevelopment {
  state: AutonomicState;
  flow$: Observable<AutonomicFlow>;
  updateFlow: (flow: Partial<AutonomicFlow>) => void;
  protect: (pattern: string) => void;
  unprotect: (pattern: string) => void;
  setEnergy: (energy: Partial<Energy>) => void;
  setContext: (context: Partial<Context>) => void;
}

export interface Pattern {
  id: string;
  name: string;
  type: string;
  description: string;
  energy: number;
  flow: FlowType;
  protection: number;
  context: string[];
  states: string[];
  metadata: PatternMetadata;
}

export interface PatternMetadata {
  created: number;
  updated: number;
  uses: number;
  success: number;
  energy: number[];
  flow: FlowType[];
  protection: number[];
  context: string[];
  states: string[];
}

export interface PatternLibrary {
  patterns: Pattern[];
  addPattern: (pattern: Pattern) => void;
  removePattern: (id: string) => void;
  updatePattern: (id: string, updates: Partial<Pattern>) => void;
  getPattern: (id: string) => Pattern | undefined;
  findPatterns: (query: Partial<Pattern>) => Pattern[];
  trackPatternUse: (id: string, success: boolean) => void;
}

export interface PatternManager {
  library: PatternLibrary;
  current: Pattern | null;
  history: Pattern[];
  setCurrent: (pattern: Pattern | null) => void;
  addToHistory: (pattern: Pattern) => void;
  clearHistory: () => void;
  findSimilar: (pattern: Pattern) => Pattern[];
  suggestNext: (current: Pattern) => Pattern[];
}

export interface AutonomicSystem {
  patterns: PatternManager;
  state: AutonomicState;
  flow$: Observable<AutonomicFlow>;
  updateFlow: (flow: Partial<AutonomicFlow>) => void;
  protect: (pattern: string) => void;
  unprotect: (pattern: string) => void;
  setEnergy: (energy: Partial<Energy>) => void;
  setContext: (context: Partial<Context>) => void;
}

export interface AutonomicHooks {
  useAutonomicDevelopment: () => UseAutonomicDevelopment;
  usePatternLibrary: () => PatternLibrary;
  usePatternManager: () => PatternManager;
  useAutonomicSystem: () => AutonomicSystem;
}

export interface AutonomicComponents {
  AutonomicProvider: React.FC;
  AutonomicContext: React.Context<AutonomicSystem>;
  PatternLibraryProvider: React.FC;
  PatternLibraryContext: React.Context<PatternLibrary>;
  PatternManagerProvider: React.FC;
  PatternManagerContext: React.Context<PatternManager>;
}

export interface AutonomicUtils {
  createPattern: (data: Partial<Pattern>) => Pattern;
  updatePattern: (pattern: Pattern, updates: Partial<Pattern>) => Pattern;
  mergePatterns: (patterns: Pattern[]) => Pattern;
  calculateEnergy: (pattern: Pattern) => number;
  calculateProtection: (pattern: Pattern) => number;
  findSimilarPatterns: (pattern: Pattern, patterns: Pattern[]) => Pattern[];
  suggestNextPatterns: (current: Pattern, patterns: Pattern[]) => Pattern[];
}

export interface AutonomicMetrics {
  patterns: {
    total: number;
    active: number;
    protected: number;
    success: number;
  };
  energy: {
    current: number;
    average: number;
    peak: number;
    low: number;
  };
  flow: {
    natural: number;
    guided: number;
    protected: number;
  };
  protection: {
    depth: number;
    patterns: number;
    states: number;
  };
  context: {
    depth: number;
    patterns: number;
    coverage: number;
  };
}

export interface AutonomicAnalytics {
  metrics: AutonomicMetrics;
  history: {
    patterns: Pattern[];
    energy: number[];
    flow: FlowType[];
    protection: number[];
  };
  insights: {
    patterns: string[];
    energy: string[];
    flow: string[];
    protection: string[];
  };
  recommendations: {
    patterns: Pattern[];
    energy: Partial<Energy>[];
    flow: FlowType[];
    protection: string[];
  };
} 