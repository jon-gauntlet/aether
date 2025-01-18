import type { BaseType } from './base';
import type { Flow } from './flow';

export enum PresenceType {
  ACTIVE = 'ACTIVE',
  IDLE = 'IDLE',
  AWAY = 'AWAY',
  OFFLINE = 'OFFLINE'
}

export interface StreamMetrics {
  presence: PresenceType;
  latency: number;
  throughput: number;
  reliability: number;
}

export interface Stream extends BaseType {
  metrics: StreamMetrics;
  flows: Flow[];
  active: boolean;
  lastUpdated: number;
}

export interface StreamState {
  id: string;
  stream: Stream;
  presence: PresenceType;
  timestamp: number;
}

export interface StreamTransition {
  from: StreamState;
  to: StreamState;
  duration: number;
  type: string;
}