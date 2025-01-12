import { Energy, EnergyMetrics } from '../energy/types';
import { FlowState } from '../types/base';

export enum PatternState {
  PROTECTED = 'PROTECTED',
  STABLE = 'STABLE',
  EVOLVING = 'EVOLVING',
  UNSTABLE = 'UNSTABLE'
}

export interface PatternMetrics {
  efficiency: number;
  sustainability: number;
  recovery: number;
  adaptability: number;
  stability: number;
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
      changes: any;
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