import { FlowSession } from './flow';

export interface FlowMetrics {
  coherence: number;
  resonance: number;
  intensity?: number;
  quality?: number;
}

export interface FlowState {
  id: string;
  type: 'natural' | 'guided' | 'resonant';
  timestamp: string;
  metrics: FlowMetrics;
}

export interface ConsciousnessState {
  flow: FlowState;
  spaces: string[];
  energy: number;
  context: string[];
}

export interface BaseMetrics {
  strength: number;
  coherence: number;
  resonance: number;
  stability: number;
  adaptability: number;
