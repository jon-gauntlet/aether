import { FlowState, FlowContext } from './flow';

export type Pattern = {
  id: string;
  name: string;
  type: string;
  energyLevel: number;
  successRate: number;
  state: FlowState;
  context: FlowContext;
};

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