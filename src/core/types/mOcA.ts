import { FlowMetrics } from './base';

export interface FlowPattern {
  id: string;
  metrics: FlowMetrics;
  timestamp: number;
}

// Re-export NaturalFlow from base
export type { NaturalFlow } from './base';