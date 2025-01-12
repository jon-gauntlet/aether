import type { FlowMetrics } from './base';

export interface MindSpace {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
}

export interface SpaceState {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
}
