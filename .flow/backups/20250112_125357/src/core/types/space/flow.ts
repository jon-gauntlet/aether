import type { FlowMetrics } from './base';

export interface FlowPattern {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
} 