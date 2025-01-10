import { Observable } from 'rxjs';
import { FlowMetrics, NaturalFlow, NaturalFlowType } from './base';
import { Connection } from './consciousness';
import { PresenceType, Stream } from './stream';

export type FlowType = NaturalFlowType;

export interface FlowState extends FlowMetrics {
  type?: FlowType;
}

export interface Flow extends NaturalFlow {
  type: FlowType;
  metrics: FlowMetrics;
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
  timestamp: number;
  
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
