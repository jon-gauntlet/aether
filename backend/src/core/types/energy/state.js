import { Field } from '../base';
import { EnergyMetrics } from './index';

export interface EnergyStateData {
  level: number;
  capacity: number;
  field: Field;
  metrics: EnergyMetrics;
  timestamp: number;
}

export interface EnergyStateTransition {
  from: EnergyStateData;
  to: EnergyStateData;
  duration: number;
}

export interface EnergyStateHistory {
  states: EnergyStateData[];
  transitions: EnergyStateTransition[];
}
