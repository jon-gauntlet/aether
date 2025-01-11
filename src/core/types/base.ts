import { Energy } from '../energy/types';

export enum FlowState {
  FLOW = 'FLOW',
  FOCUS = 'FOCUS',
  RECOVERING = 'RECOVERING',
  TRANSITIONING = 'TRANSITIONING'
}

export interface IWave {
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface IResonance {
  primary: IWave;
  harmonics: IWave[];
  frequency: number;
  amplitude: number;
  phase: number;
  coherence: number;
  harmony: number;
}

export interface IField {
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
  resonance: IResonance;
  protection: {
    level: number;
    type: string;
    shields: number;
  };
  energy: Energy;
  waves: IWave[];
}

export const createDefaultField = (): IField => ({
  id: '',
  center: { x: 0, y: 0, z: 0 },
  radius: 1,
  strength: 1,
  coherence: 1,
  stability: 1,
  resonance: {
    primary: { frequency: 1, amplitude: 1, phase: 0 },
    harmonics: [],
    frequency: 1,
    amplitude: 1,
    phase: 0,
    coherence: 1,
    harmony: 1
  },
  protection: {
    level: 1,
    type: 'standard',
    shields: 1
  },
  energy: {
    mental: 1,
    physical: 1,
    emotional: 1
  },
  waves: []
});
