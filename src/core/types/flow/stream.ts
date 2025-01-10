import { FlowMetrics, NaturalFlow, Resonance } from './core';

export type StreamId = string;

export type PresenceType = 'active' | 'passive' | 'observing' | 'thinking' | 'reading' | 'writing' | 'listening' | 'dormant';

export interface Stream {
  id: StreamId;
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
