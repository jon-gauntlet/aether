import { Observable } from 'rxjs';
import { Connection, Depth } from './index';

// Flow state types
export type FlowLevel = 'low' | 'medium' | 'high';
export type FlowState = 'rest' | 'flow' | 'focus' | 'deep';

// Core metrics interface
export interface FlowMetrics {
  presence: number;   // Inner presence level
  harmony: number;    // Flow harmony
  rhythm: number;     // Natural rhythm
  resonance: number;  // System resonance
  coherence: number;  // State coherence
}

// Pure data state for serialization
export interface FlowStateData extends FlowMetrics {
  level: FlowLevel;
  state: FlowState;
  depth: Depth;
}

// Active flow interface with observables
export interface NaturalFlow extends FlowStateData {
  // Observable methods
  observeDepth(): Observable<number>;
  observeEnergy(): Observable<number>;
  observeFocus(): Observable<number>;
}

// Flow session tracking
export interface FlowSession {
  id: string;
  state: FlowState;
  level: FlowLevel;
  startTime: string;
  endTime?: string;
  isProtected?: boolean;
  metrics: {
    duration: number;
    intensity: number;
    quality: number;
  };
  patterns: string[];
}

// Space flow state
export interface FlowSpaceState {
  id: string;
  type: 'meditation' | 'focus' | 'flow';
  flow: FlowStateData;
  depth: number;
  connections: Connection[];
}

// Active space flow
export interface FlowSpace extends Omit<FlowSpaceState, 'flow'> {
  flow: NaturalFlow;
}

// System-level flow
export interface SystemFlow extends FlowMetrics {
  pace: number;        // Flow velocity
  adaptability: number;// System flexibility
  emergence: number;   // Pattern emergence
  balance: number;     // System balance
