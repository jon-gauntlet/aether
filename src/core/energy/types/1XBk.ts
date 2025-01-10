import { Energy } from '../energy/types';

export enum FlowState {
  FLOW = 'FLOW',
  FOCUS = 'FOCUS',
  RECOVERING = 'RECOVERING',
  TRANSITIONING = 'TRANSITIONING'
}

export interface Wave {
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Resonance {
  primary: Wave;
  harmonics: Wave[];
  frequency: number;
  amplitude: number;
  phase: number;
  coherence: number;
  harmony: number;
}

export interface Field {
  id: string;
  center: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  strength: number;
  coherence: number;
  stability: number;
  resonance: Resonance;
  protection: {
    level: number;
    type: string;
    shields: number;
  };
  energy: Energy;
  waves: Wave[];
} 