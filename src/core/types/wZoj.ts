import { Observable } from 'rxjs';
import { Stream } from '../experience/flow';

export interface FlowMetrics {
  productivity: number;
  quality: number;
  energy: number;
  satisfaction: number;
}

export type FlowType = 'text' | 'voice' | 'visual' | 'spatial';

export interface FlowPattern {
  id: string;
  type: FlowType;
  state: FlowState;
  context: FlowContext;
}

export interface FlowState {
  active: boolean;
  depth: FlowDepth;
  energy: number;
  resonance: Resonance;
  harmony: number;
  naturalCycles: NaturalCycles;
  protection: Protection;
  timestamp: number;
}

export type FlowDepth = 'surface' | 'shallow' | 'deep' | 'profound';

export interface Resonance {
  frequency: number;
  amplitude: number;
  harmony: number;
  essence: number;
  field: Field;
}

export interface Field {
  center: Point3D;
  radius: number;
  strength: number;
  waves: Wave[];
}

export interface Wave {
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Protection {
  strength: number;
  resilience: number;
  adaptability: number;
}

export interface NaturalCycles {
  rhythm: number;
  resonance: number;
  harmony: number;
}

export interface FlowContext {
  task: string;
  goal: string;
  constraints: string[];
  resources: string[];
}

export interface Flow {
  state: FlowStateType;
  context: FlowContext;
  duration: number;
  meta: FlowMeta;
}

export enum FlowStateType {
  Deep = 'deep',
  Focused = 'focused',
  Learning = 'learning',
  Exploring = 'exploring',
  Integrating = 'integrating'
}

export interface FlowMeta {
  started: Date;
  lastTransition: Date;
  transitions: FlowTransition[];
  metrics: FlowMetrics;
}

export interface FlowTransition {
  from: FlowStateType;
  to: FlowStateType;
  timestamp: Date;
  trigger: string;
}