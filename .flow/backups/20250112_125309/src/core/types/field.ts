import type { FlowMetrics } from './base';

export interface Field {
  id: string;
  name: string;
  type: string;
  metrics: FlowMetrics;
  resonance: {
    frequency: number;
    amplitude: number;
    phase: number;
  };
  protection: {
    shields: number;
    resilience: number;
    adaptability: number;
    stability: number;
    integrity: number;
  };
  flowMetrics: {
    conductivity: number;
    resistance: number;
    momentum: number;
  };
  strength: number;
} 