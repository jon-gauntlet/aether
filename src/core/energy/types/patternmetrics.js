import { Energy, EnergyMetrics } from '../energy/types';
import { FlowState } from '../types/base';

export enum PatternState {
  EVOLVING = 'EVOLVING',
  STABLE = 'STABLE',
  PROTECTED = 'PROTECTED'
}

export interface PatternMetrics extends EnergyMetrics {
  adaptability: number;
  resonance: number;
}

export interface PatternContext {
  flowState: FlowState;
  energyLevels: Energy;
  metrics: PatternMetrics;
  metadata?: Record<string, any>;
}

export interface EnergyPattern {
  id: string;
  name: string;
  flowState: FlowState;
  energyLevels: Energy;
  metrics: EnergyMetrics;
  state: PatternState;
  evolution: {
    version: number;
    history: Array<{
      timestamp: Date;
      changes: Partial<EnergyPattern>;
      success: boolean;
    }>;
  };
  metadata?: Record<string, any>;
}

export interface PatternMatch {
  pattern: EnergyPattern;
  confidence: number;
  context: PatternContext;
} 