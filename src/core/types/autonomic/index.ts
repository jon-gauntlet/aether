import type { FlowMetrics } from '../base';

export interface AutonomicState {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
}

export interface AutonomicDevelopmentProps {
  id: string;
  type: string;
  metrics: FlowMetrics;
  active: boolean;
  timestamp: number;
}
