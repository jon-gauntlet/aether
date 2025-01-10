import { Observable } from 'rxjs';
import { FlowMetrics, NaturalFlow } from './base';
import { Connection } from './consciousness';
import { PresenceType, Stream } from './stream';

export type FlowType = 'natural' | 'guided' | 'resonant';

export interface FlowState extends FlowMetrics {
  type?: FlowType;
}

export interface Flow extends NaturalFlow {
  type: FlowType;
  metrics: {
    depth: number;
    harmony: number;
    energy: number;
  };
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
  
  // Stream methods
  observe(id: string): Observable<Stream | undefined>;
  notice(id: string, type: PresenceType): void;
  stream?: Stream;
  
  // Navigation methods
  add(id: string, items: any[]): void;
  wake(id: string): void;
  
  // Connection methods
  connect(target: Flow): Connection;
  disconnect(connectionId: string): void;
  updatePresence(type: PresenceType): void;
  
  // Flow observation
  observeFlow(): Observable<FlowState>;
  observePresence(): Observable<number>;
  observeHarmony(): Observable<number>;
  observeResonance(): Observable<number>;
}

export interface FlowPattern {
  type: FlowType;
  state: FlowState;
  connections: Connection[];
