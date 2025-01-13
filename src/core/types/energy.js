import type { FlowMetrics } from './base';

export interface EnergyState {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
}

export interface EnergyMetrics {
  mental: number;
  physical: number;
  emotional: number;
  focus: number;
  flow: number;
} 