import { Connection, FlowMetrics, Resonance, Protection, NaturalFlow } from './base';

export interface MindSpace {
  id: string;
  type: string;
  metrics: FlowMetrics;
  resonance: Resonance;
  protection: Protection;
  connections: Connection[];
  flow: NaturalFlow;
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