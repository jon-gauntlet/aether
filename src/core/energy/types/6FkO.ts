import { Observable } from 'rxjs';
import { Stream } from '../experience/flow';

export interface FlowMetrics {
  depth: number;
  harmony: number;
  energy: number;
  focus: number;
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
  divine: number;
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
  space?: string;
  depth?: number;
  intention?: string;
}

export interface Flow {
  stream: Stream | undefined;
  otherStreams: Stream[];
  metrics: FlowMetrics;
  isDeep: boolean;
  isHarmonious: boolean;
  flows: string[];
  enter: (type: FlowType) => void;
  observe: (id: string) => Observable<Stream | null>;
  observeDepth: () => Observable<number>;
  observeEnergy: () => Observable<number>;
  observeFocus: () => Observable<number>;
  notice: (id: string) => void;
} 