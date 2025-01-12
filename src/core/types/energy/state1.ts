import { Field, Resonance } from './consciousness';

export interface EnergyState {
  level: number;
  capacity: number;
  resonance: Resonance;
  field: Field;
  flow: number;
  recovery: number;
  timestamp: number;
}
