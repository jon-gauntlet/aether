import { Field } from '../base';

export interface EnergyFlowConfig {
  minStrength: number;
  maxStrength: number;
  decayRate: number;
  propagationSpeed: number;
}

export interface EnergyFlowState {
  source: Field;
  target: Field;
  strength: number;
  direction: 'in' | 'out';
  timestamp: number;
}

export interface EnergyFlowTransition {
  from: EnergyFlowState;
  to: EnergyFlowState;
  duration: number;
}

export interface EnergyFlowHistory {
  flows: EnergyFlowState[];
  transitions: EnergyFlowTransition[];
  config: EnergyFlowConfig;
}

export interface EnergyFlowAnalytics {
  averageStrength: number;
  peakStrength: number;
  flowDuration: number;
  flowFrequency: number;
  directionBalance: number;
} 