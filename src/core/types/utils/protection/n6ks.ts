import { Field, Protection, Resonance } from './consciousness';

export type EnergyState = {
  mode: 'deep' | 'steady' | 'reflective' | 'analytical';
  level: number;
  capacity: number;
  purity: number;
  peace: number;
  resonance: Resonance;
  protection: Protection;
  field: Field;
  timestamp: number;
};

export type FlowMetrics = {
  averageDepth: number;
  sustainedFocus: number;
  coherenceLevel: number;
  protectionStrength: number;
};

