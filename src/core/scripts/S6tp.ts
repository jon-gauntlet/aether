import { FlowMetrics, Resonance } from './base';

export type PresenceType = 'natural' | 'guided' | 'resonant';

export interface Stream {
  id: string;
  type: PresenceType;
  metrics: FlowMetrics;
  resonance: Resonance;
  timestamp: number;
}