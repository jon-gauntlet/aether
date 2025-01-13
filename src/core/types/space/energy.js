import type { FlowMetrics } from './base';

export interface EnergyState {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
} 