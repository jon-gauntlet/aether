import { Field, Resonance } from './base';

export interface EnergyState {
  level: number;
  capacity: number;
  flow: number;
  stability: number;
  quality: number;
  protection: number;
  resonance: Resonance;
  field: Field;
  recovery: number;
  reserves: number;
  timestamp: number;
}

export const isEnergized = (state: EnergyState): boolean => {
  return state.level > 0.7 && state.stability > 0.6;
};

export const hasReserves = (state: EnergyState): boolean => {
  return state.reserves > 0.3;
};

export const isStable = (state: EnergyState): boolean => {
  return state.stability > 0.8;
}; 