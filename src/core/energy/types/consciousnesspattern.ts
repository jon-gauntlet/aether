import { PatternType, EnergyFlowType } from './order';
import { Pattern } from '../autonomic/types';
import { Energy } from '../energy/types';
import { Flow } from '../flow/types';

export interface ConsciousnessPattern extends Pattern {
  type: PatternType;
  energy: Energy;
  flow: Flow;
  meta: {
    depth: number;
    clarity: number;
    presence: number;
  };
}

export interface EnergyFlow {
  type: EnergyFlowType;
  strength: number;
  direction: 'inward' | 'outward';
  meta: {
    quality: number;
    stability: number;
    resonance: number;
  };
}

export interface FlowPattern extends Pattern {
  flow: Flow;
  energy: Energy;
  meta: {
    velocity: number;
    coherence: number;
    harmony: number;
  };
}

export interface AutonomicState {
  patterns: Pattern[];
  energy: Energy;
  flow: Flow;
  meta: {
    balance: number;
    stability: number;
    adaptability: number;
  };
}

export interface SystemPattern extends Pattern {
  type: PatternType;
  state: AutonomicState;
  meta: {
    complexity: number;
    resilience: number;
    evolution: number;
  };
}

export interface EnergyIndex {
  patterns: Map<string, Pattern>;
  flows: Map<string, EnergyFlow>;
  meta: {
    lastUpdated: Date;
    totalEnergy: number;
    averageFlow: number;
  };
}