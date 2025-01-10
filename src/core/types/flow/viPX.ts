import { Observable } from 'rxjs';
import { FlowMetrics, NaturalFlow } from './base';
import { Connection } from './consciousness';
import { PresenceType, Stream } from './stream';

export type FlowType = 'natural' | 'guided' | 'resonant';

export type FlowState = {
  type: FlowType;
  depth: number;
  harmony: number;
  energy: number;
  resonance: number;
  rhythm: number;
  presence: number;
  coherence: number;
  focus: number;
  timestamp: number;
};

export type FlowContext = {
  task: string;
  goal: string;
  constraints: string[];
  resources: string[];
};

export type Flow = {
  current: FlowState;
  history: FlowState[];
  metrics: {
    averageDepth: number;
    sustainedFocus: number;
    coherenceLevel: number;
    protectionStrength: number;
  };
};

export type FlowPattern = {
  id: string;
  type: FlowType;
  state: FlowState;
  context: FlowContext;
};

export interface FlowTransition {
  from: string;
  to: string;
  trigger: string;
  quality: number;
}

export interface FlowProtection {
  level: number;
  type: string;
  duration: number;
  strength: number;
