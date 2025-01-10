import { Connection, FlowMetrics, FlowState } from './consciousness';
import { Observable } from 'rxjs';

export interface FlowPattern {
  id: string;
  metrics: FlowMetrics;
  timestamp: number;
}

export interface NaturalFlow extends FlowState {
  observeDepth(): Observable<number>;
  observeEnergy(): Observable<number>;
  observeFocus(): Observable<number>;
  observeResonance(): Observable<number>;
