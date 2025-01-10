import { FlowMetrics, NaturalFlow, Resonance, Protection, Connection } from './base';

export interface MindSpace {
  id: string;
  type: string;
  metrics: FlowMetrics;
  resonance: Resonance;
  depth: number;
  protection: Protection;
  flow: NaturalFlow;
  connections: Connection[];
  timestamp: number;
}

export interface SpaceState {
  id: string;
  type: string;
  metrics: FlowMetrics;
  connections: Connection[];
