import { FlowMetrics, Resonance } from '../base';

export type StreamId = string;

export type PresenceType = 'active' | 'passive' | 'observing' | 'thinking' | 'reading' | 'writing' | 'listening' | 'dormant';

export interface Stream {
  id: StreamId;
  type: PresenceType;
  metrics: FlowMetrics;
  resonance: Resonance;
  timestamp: number;
  lastActivity?: number;
  flowState?: string;
  depth?: number;
  stillness?: number;
  presence?: number;
  clarity?: number;
  near?: any[];
  harmony?: number;
}
