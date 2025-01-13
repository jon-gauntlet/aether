import type { FlowMetrics } from './base';

export interface AdvancedFlowMetrics extends FlowMetrics {
  depth: number;
  stability: number;
  evolution: number;
}

export interface Flow {
  id: string;
  type: string;
  metrics: AdvancedFlowMetrics;
  active: boolean;
  timestamp: number;
}

export interface ConsciousnessState {
  id: string;
  type: string;
  metrics: AdvancedFlowMetrics;
  active: boolean;
  timestamp: number;
}

export interface SystemMeta {
  version: string;
  timestamp: number;
  metrics: AdvancedFlowMetrics;
}

export interface FlowSpace {
  id: string;
  type: string;
  metrics: AdvancedFlowMetrics;
  active: boolean;
  timestamp: number;
}

export interface FlowSpaceState {
  id: string;
  type: string;
  metrics: AdvancedFlowMetrics;
  active: boolean;
  timestamp: number;
}

export interface ThoughtStream {
  id: string;
  type: string;
  metrics: AdvancedFlowMetrics;
  active: boolean;
  timestamp: number;
}

export interface ThoughtEvolution {
  id: string;
  type: string;
  metrics: AdvancedFlowMetrics;
  active: boolean;
  timestamp: number;
} 