import { FlowState, FlowContext } from './flow';

export interface Pattern {
  id: string;
  name: string;
  type: 'flow' | 'development' | 'integration';
  strength: number;
  context: string[];
  evolution: {
    stage: number;
    history: string[];
  };
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