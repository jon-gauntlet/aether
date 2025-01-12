import { Connection } from './consciousness';

export interface FlowPattern {
  id: string;
  type: FlowType;
  state: FlowState;
  context: FlowContext;
}

export type FlowType = 'text' | 'voice' | 'visual' | 'spatial';

export interface FlowState {
  active: boolean;
  depth: FlowDepth;
  energy: number;
  resonance: number;
  harmony: number;
  timestamp: number;
}

export type FlowDepth = 'surface' | 'shallow' | 'deep' | 'profound';

export interface FlowContext {
  space?: string;
  depth?: number;
  intention?: string;
}

export interface Flow {
  id: string;
  type: FlowType;
  state: FlowState;
  connections: Connection[];
} 