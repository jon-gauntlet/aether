import { FlowMetrics, Resonance } from './base';
import { Pattern } from '../autonomic/types';
import { EnergyFlow } from './consciousness';
import { Observable } from 'rxjs';

export type StreamId = string;

export type PresenceType = 'active' | 'passive' | 'dormant';

export interface Stream {
  id: StreamId;
  type: string;
  timestamp: number;
}

export interface PatternStream {
  source: Observable<Pattern>;
  meta: {
    type: 'pattern';
    name: string;
    description: string;
  };
  transform: (pattern: Pattern) => Pattern;
}

export interface EnergyStream {
  source: Observable<EnergyFlow>;
  meta: {
    type: 'energy';
    name: string;
    description: string;
  };
  transform: (flow: EnergyFlow) => EnergyFlow;
}