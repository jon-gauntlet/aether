import type { Presence, Harmony, Energy, Depth } from './order';

export interface Connection {
  id: string;
  source: string;
  target: string;
  strength: number;
  type: string;
}

export interface Field {
  id: string;
  strength: number;
  resonance: number;
  coherence: number;
}

export interface Wave {
  id: string;
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface NaturalFlow {
  id: string;
  rate: number;
  pattern: string;
  quality: number;
}

export interface EnergyState {
  current: number;
  capacity: number;
  flow: number;
}

export interface FlowSpace {
  id: string;
  velocity: number;
  direction: number;
  intensity: number;
}

export interface MindSpace {
  id: string;
  clarity: number;
  focus: number;
  stability: number;
}

export interface Resonance {
  id: string;
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Protection {
  id: string;
  level: number;
  type: string;
  strength: number;
}

export interface ConsciousnessState {
  presence: Presence;
  harmony: Harmony;
  energy: Energy;
  depth: Depth;
} 