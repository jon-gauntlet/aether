import { Energy } from '../energy/types';

export enum FlowState {
  FOCUS = 'FOCUS',
  FLOW = 'FLOW',
  BREAK = 'BREAK',
  RECOVERING = 'RECOVERING',
  TRANSITIONING = 'TRANSITIONING'
}

export interface Field {
  id: string;
  name: string;
  strength: number;
  energy: Energy;
  resonance: {
    amplitude: number;
    frequency: number;
    phase: number;
  };
  protection: {
    shields: number;
    resilience: number;
    recovery: number;
    adaptability: number;
  };
  flowMetrics: {
    conductivity: number;
    resistance: number;
    capacity: number;
  };
  metadata?: Record<string, any>;
} 