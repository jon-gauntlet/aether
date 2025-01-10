import { Observable } from 'rxjs';
import { FlowMetrics, NaturalFlow } from './base';
import { Connection } from './consciousness';
import { PresenceType, Stream } from './stream';

export type FlowType = 'natural' | 'guided' | 'resonant';

export interface FlowState {
  current: Flow;
  history: Flow[];
  metrics: {
    averageDepth: number;
    sustainedFocus: number;
    coherenceLevel: number;
    protectionStrength: number;
  };
}

export interface Flow {
  state: 'natural' | 'guided' | 'protected';
  context: {
    type: string;
    depth: number;
    duration: number;
  };
  metrics: {
    focus: number;
    presence: number;
    coherence: number;
    sustainability: number;
  };
  protection: {
    level: number;
    type: string;
    strength: number;
  };
}

export interface FlowPattern {
  type: FlowType;
  state: FlowState;
  connections: Connection[];
}

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
}