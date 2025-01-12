import type { FlowMetrics } from './base';

export interface ContextState {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
}

export interface DevelopmentContext {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
} 