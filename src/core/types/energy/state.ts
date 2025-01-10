import { Field, Resonance } from './base';

export interface EnergyState {
  level: number;
  capacity: number;
  flow: number;
  stability: number;
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
