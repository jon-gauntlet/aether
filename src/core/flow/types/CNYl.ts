import { FlowMetrics, NaturalFlow, Resonance } from './base';

export type PresenceType = 'active' | 'passive' | 'observing' | 'thinking' | 'reading' | 'writing' | 'listening';

export interface Stream {
  id: string;
  type: PresenceType;
  metrics: FlowMetrics;
  flow: NaturalFlow;
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