import { FlowState } from './flow';

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
  };
  metadata?: {
    tags: string[];
    category: string;
    priority: number;
  };
}

export type PatternStage = 'emerging' | 'growing' | 'established' | 'refined' | 'mastered';

export interface PatternAnalytics {
  entropyFactor: number;
  evolutionRate: number;
  strengthGrowth: number;
  stabilityScore: number;
}

export interface PatternContextType {
  activePatterns: Pattern[];
  addPattern: (pattern: Omit<Pattern, 'id'>) => void;
  removePattern: (id: string) => void;
  evolvePattern: (id: string) => void;
}

export interface PatternProviderProps {
  children: React.ReactNode;
}

export type StoredPattern = Pattern & {
  timestamp: number;
  metrics: {
    uses: number;
    successes: number;
    failures: number;
    averageEnergy: number;
  };
};

export type PatternStats = {
  totalPatterns: number;
  activePatterns: number;
  successRate: number;
  averageEnergy: number;
  topPatterns: Pattern[];
}; 