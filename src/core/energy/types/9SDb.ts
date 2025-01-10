import { FlowState, FlowMetrics, Protection, Pattern, Resonance, DevelopmentPhase } from './base';
import { Observable } from 'rxjs';

export interface EnergyState {
  id: string;
  mode: string;
  level: number;
  capacity: number;
  purity: number;
  peace: number;
  resonance: Resonance;
  protection: Protection;
  timestamp: number;
}

export interface EnergyMetrics extends FlowMetrics {
  efficiency: number;
  sustainability: number;
  recovery: number;
  balance: number;
}

export interface EnergyPattern extends Pattern {
  efficiency: number;
  sustainability: number;
  recovery: number;
  balance: number;
  developmentPhase: DevelopmentPhase;
}

export interface EnergyValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metrics: EnergyMetrics;
}

export interface EnergyTransition {
  from: EnergyState;
  to: EnergyState;
  duration: number;
  quality: number;
  efficiency: number;
}

export interface EnergyProtection extends Protection {
  efficiency: number;
  sustainability: number;
  recovery: number;
  balance: number;
}

export interface EnergyAnalytics {
  efficiency: number;
  sustainability: number;
  recovery: number;
  balance: number;
  patterns: EnergyPattern[];
  transitions: EnergyTransition[];
}

export interface EnergyCycle {
  phase: string;
  duration: number;
  intensity: number;
  recovery: number;
  patterns: EnergyPattern[];
}

export interface EnergyOptimization {
  target: EnergyState;
  current: EnergyState;
  efficiency: number;
  suggestions: string[];
  patterns: EnergyPattern[];
}