export enum FlowState {
  FLOW = 'FLOW',
  FOCUS = 'FOCUS',
  HYPERFOCUS = 'HYPERFOCUS',
  DISTRACTED = 'DISTRACTED',
  EXHAUSTED = 'EXHAUSTED',
  RECOVERING = 'RECOVERING'
}

export interface Field {
  id: string;
  name: string;
  strength: number;
  resonance: Resonance;
  protection: Protection;
  flowMetrics: FlowMetrics;
  naturalFlow: NaturalFlow;
}

export interface Resonance {
  frequency: number;
  amplitude: number;
  phase: number;
  harmonics: number[];
}

export interface Protection {
  shields: number;
  recovery: number;
  resilience: number;
  adaptability: number;
}

export interface FlowMetrics {
  velocity: number;
  momentum: number;
  resistance: number;
  conductivity: number;
}

export interface NaturalFlow {
  direction: number;
  intensity: number;
  stability: number;
  sustainability: number;
}

export const createDefaultField = (): Field => ({
  id: crypto.randomUUID(),
  name: 'Default Field',
  strength: 1.0,
  resonance: {
    frequency: 1.0,
    amplitude: 1.0,
    phase: 0,
    harmonics: []
  },
  protection: {
    shields: 1.0,
    recovery: 1.0,
    resilience: 1.0,
    adaptability: 1.0
  },
  flowMetrics: {
    velocity: 0,
    momentum: 0,
    resistance: 0,
    conductivity: 1.0
  },
  naturalFlow: {
    direction: 0,
    intensity: 1.0,
    stability: 1.0,
    sustainability: 1.0
  }
