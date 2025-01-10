import { Observable } from 'rxjs';
import { FlowMetrics, NaturalFlow } from './base';
import { Connection } from './consciousness';
import { PresenceType } from './stream';

export type FlowType = 'natural' | 'guided' | 'resonant';

export interface FlowState extends FlowMetrics {
  type?: FlowType;
}

export interface Flow extends NaturalFlow {
  type: FlowType;
  observe(): Observable<FlowState>;
  connect(target: Flow): Connection;
  disconnect(connectionId: string): void;
  updatePresence(type: PresenceType): void;
}

export interface FlowPattern {
  type: FlowType;
  state: FlowState;
  connections: Connection[];
}