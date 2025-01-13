import { Field } from '../base';

export type EnergyState = 'charging' | 'draining' | 'stable';

export interface EnergyMetrics {
  level: number;
  capacity: number;
  recovery: number;
  sustainability: number;
  efficiency: number;
}

export interface Energy {
  state: EnergyState;
  metrics: EnergyMetrics;
}

export interface EnergyFlow {
  source: Field;
  target: Field;
  strength: number;
  direction: 'in' | 'out';
}

export interface EnergySystem {
  getCurrentEnergy(): number;
  updateEnergy(delta: number): void;
  getMetrics(): EnergyMetrics;
  setMetrics(metrics: Partial<EnergyMetrics>): void;
}

export * from './state';
export * from './metrics';
export * from './flow';
