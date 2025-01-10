import { Field, Resonance } from './base';

export interface Energy {
  level: number;
  type: 'deep' | 'steady' | 'reflective' | 'analytical';
  flow: 'natural' | 'guided' | 'protected';
  metrics: {
    focus: number;
    clarity: number;
    presence: number;
    sustainability: number;
  };
  protection: {
    level: number;
    recovery: number;
    reserves: number;
  };
}

export interface EnergyState {
  current: Energy;
  history: Energy[];
  metrics: {
    averageLevel: number;
    sustainedFocus: number;
    recoveryRate: number;
    protectionStrength: number;
  };
}

export interface EnergyFlow {
  source: string;
  target: string;
  amount: number;
  quality: string;
}

export interface EnergyProtection {
  level: number;
  type: string;
  duration: number;
  strength: number;
