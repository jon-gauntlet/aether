import { FlowMetrics, Resonance } from './base';

export type StreamId = string;

export type PresenceType = 'active' | 'passive' | 'dormant';

export interface Stream {
  id: StreamId;
  type: string;
  timestamp: number;
}