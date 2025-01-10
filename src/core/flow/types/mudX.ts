import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  FlowMetrics,
  NaturalFlow,
  NaturalFlowType,
  Resonance,
  Field
} from '../types/base';
import { Stream } from '../types/stream';

interface InternalFlow {
  type: NaturalFlowType;
  metrics: FlowMetrics;
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
  timestamp: number;
  streams: Map<string, Stream>;
}

export class NaturalFlowImpl implements NaturalFlow {
  private state: BehaviorSubject<InternalFlow>;

  type: NaturalFlowType = 'natural';
  metrics: FlowMetrics;
  presence: number = 0;
  harmony: number = 0;
  rhythm: number = 0;
  resonance: number = 0;
  coherence: number = 0;
  timestamp: number = Date.now();
  depth?: number;
  energy?: number;

  constructor(initialState?: Partial<InternalFlow>) {
    this.metrics = {
      depth: 0,
      harmony: 0,
      energy: 0,
      presence: 0,
      resonance: 0,
      coherence: 0,
      rhythm: 0
    };

    this.state = new BehaviorSubject<InternalFlow>({
      type: this.type,
      metrics: this.metrics,
      presence: initialState?.presence ?? 1,
      harmony: initialState?.harmony ?? 1,
      rhythm: initialState?.rhythm ?? 1,
      resonance: initialState?.resonance ?? 1,
      coherence: initialState?.coherence ?? 1,
      timestamp: Date.now(),
      streams: new Map()
    });

    this.depth = initialState?.metrics?.depth ?? 0;
    this.energy = initialState?.metrics?.energy ?? 0;
  }

  private updateState(changes: Partial<InternalFlow>): void {
    const currentState = this.state.value;
    this.state.next({
      ...currentState,
      ...changes,
      timestamp: Date.now()
    });
  }

  observe(): Observable<InternalFlow> {
    return this.state.asObservable();
  }

  observeMetrics(): Observable<FlowMetrics> {
    return this.state.pipe(
      map(state => state.metrics)
    );
  }

  observePresence(): Observable<number> {
    return this.state.pipe(
      map(state => state.presence)
    );
  }

  observeHarmony(): Observable<number> {
    return this.state.pipe(
      map(state => state.harmony)
    );
  }

  observeResonance(): Observable<number> {
    return this.state.pipe(
      map(state => state.resonance)
    );
  }

  observeCoherence(): Observable<number> {
    return this.state.pipe(
      map(state => state.coherence)
    );
  }

  observeRhythm(): Observable<number> {
    return this.state.pipe(
      map(state => state.rhythm)
    );
  }
}

export type { NaturalFlow } from '../types/base';