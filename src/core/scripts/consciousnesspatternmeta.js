import { PatternType, EnergyFlowType } from './order';
import { Pattern, PatternMeta } from '../autonomic/types';
import { Energy } from '../energy/types';
import { Flow } from '../flow/types';

export interface ConsciousnessPatternMeta extends PatternMeta {
  depth: number;
  clarity: number;
  presence: number;
}

export interface ConsciousnessPattern extends Pattern {
  type: PatternType;
  energy: Energy;
  flow: Flow;
  meta: ConsciousnessPatternMeta;
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

export interface FlowPatternMeta extends PatternMeta {
  velocity: number;
  coherence: number;
  harmony: number;
}

export interface FlowPattern extends Pattern {
  flow: Flow;
  energy: Energy;
  meta: FlowPatternMeta;
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

export interface SystemPatternMeta extends PatternMeta {
  complexity: number;
  resilience: number;
  evolution: number;
}

export interface SystemPattern extends Pattern {
  type: PatternType;
  state: AutonomicState;
  meta: SystemPatternMeta;
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

export type ConsciousnessState = {
  type: 'deep' | 'steady' | 'reflective' | 'analytical';
  flow: 'natural' | 'guided' | 'protected';
  level: number;
};

export type Resonance = {
  frequency: number;
  amplitude: number;
  phase: number;
  coherence: number;
};

export type Protection = {
  depth: number;
  strength: number;
  patterns: string[];
  states: string[];
};

export type Field = {
  intensity: number;
  direction: string;
  coherence: number;
  resonance: Resonance;
};

export type NaturalFlow = {
  depth: number;
  harmony: number;
  energy: number;
  presence: number;
  resonance: number;
  coherence: number;
  rhythm: number;
};