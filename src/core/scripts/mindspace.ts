import { Connection, FlowMetrics, Resonance, Protection } from './consciousness';

export interface MindSpace {
  id: string;
  type: string;
  metrics: FlowMetrics;
  resonance: Resonance;
  protection: Protection;
  connections: Connection[];
  depth: number;
  timestamp: number;
}

export interface SpaceState {
  id: string;
  type: string;
  metrics: FlowMetrics;
  connections: Connection[];
  timestamp: number;
}