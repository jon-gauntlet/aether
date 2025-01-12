import { Field, Resonance } from './base';

export interface EnergyState {
  level: number;
  capacity: number;
  quality: number;
  stability: number;
  protection: number;
  resonance: Resonance;
  field: Field;
  flow: number;
  recovery: number;
  timestamp: number;
} 