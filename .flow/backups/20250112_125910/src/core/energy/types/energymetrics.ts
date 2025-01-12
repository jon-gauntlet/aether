import { Field, Resonance } from './base';

export interface EnergyMetrics {
  level: number;
  capacity: number;
  stability: number;
  flow: number;
  coherence: number;
}

export interface EnergyProtection {
  level: number;
  type: 'natural' | 'enhanced' | 'autonomous';
}

export interface EnergyState {
  id: string;
  level: number;
  capacity: number;
  protection: number;
  timestamp: number;
  resonance: Resonance;
  field: Field;
  metrics: EnergyMetrics;
}

export interface EnergyTransition {
  from: EnergyState;
  to: EnergyState;
  trigger: string;
  timestamp: number;
}

export interface EnergyPattern {
  id: string;
  type: string;
  metrics: EnergyMetrics;
  transitions: EnergyTransition[];
}

// Development-specific types
export interface DevelopmentEnergy extends EnergyState {
  type: 'development';
  pattern: EnergyPattern;
  validationLevel: number;
  autonomicLevel: number;
}