import type { FlowMetrics } from './base';

export type PresenceType = 'active' | 'passive' | 'dormant';

export interface Stream {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
} 