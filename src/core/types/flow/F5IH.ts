import { FlowMetrics, NaturalFlow, Resonance } from './base';

export type PresenceType = 'active' | 'passive' | 'observing';

export interface Stream {
  id: string;
  type: PresenceType;
  metrics: FlowMetrics;
  flow: NaturalFlow;
  resonance: Resonance;
  timestamp: number;
