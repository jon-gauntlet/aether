import { FlowState } from '../types/base';
import { Energy, EnergyMetrics } from '../energy/types';

export enum PatternState {
  ACTIVE = 'ACTIVE',
  STABLE = 'STABLE',
  EVOLVING = 'EVOLVING',
  PROTECTED = 'PROTECTED'
}

export interface PatternContext {
  timestamp: Date;
  duration: number;
  tags: string[];
  triggers: string[];
  notes: string;
}

export interface PatternMetrics {
  confidence: number;
  stability: number;
  frequency: number;
  lastSuccess: Date;
  successRate: number;
}

export interface EnergyPattern {
  id: string;
  state: PatternState;
  flowState: FlowState;
  energyLevels: Energy;
  metrics: EnergyMetrics;
  context: PatternContext;
  evolution: {
    version: number;
    history: Array<{
      timestamp: Date;
      changes: Partial<EnergyPattern>;
      success: boolean;
    }>;
  };
}

export interface PatternMatch {
  pattern: EnergyPattern;
  confidence: number;
  predictedEnergy: Energy;
  estimatedDuration: number;
}

export interface PatternEvolution {
  pattern: EnergyPattern;
  changes: Partial<EnergyPattern>;
  fitness: number;
  generation: number;
}

export interface PatternStorage {
  patterns: EnergyPattern[];
  lastUpdate: Date;
  version: number;
} 