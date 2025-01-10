import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NaturalFlow, FlowMetrics, NaturalFlowType, Connection } from '../types/base';
import { Stream } from '../types/stream';

export class FlowEngine implements NaturalFlow {
  private flowSubject: BehaviorSubject<NaturalFlow>;
  private streams = new Map<string, Stream>();

  type: NaturalFlowType = 'natural';
  metrics: FlowMetrics;
  presence: number = 0.8;
  harmony: number = 0.8;
  rhythm: number = 0.8;
  resonance: number = 0.8;
  coherence: number = 0.8;
  depth: number = 0.8;
  energy: number = 0.8;
  timestamp: number = Date.now();

  constructor(initialState?: Partial<NaturalFlow>) {
    this.metrics = {
      depth: initialState?.depth ?? 0.8,
      harmony: initialState?.harmony ?? 0.8,
      energy: initialState?.energy ?? 0.8,
      presence: initialState?.presence ?? 0.8,
      resonance: initialState?.resonance ?? 0.8,
      coherence: initialState?.coherence ?? 0.8,
      rhythm: initialState?.rhythm ?? 0.8
    };

    this.flowSubject = new BehaviorSubject<NaturalFlow>(this);
  }

  // FlowState implementation
  observeDepth(): Observable<number> {
    return this.flowSubject.pipe(
      map(state => state.depth)
    );
  }

  observeEnergy(): Observable<number> {
    return this.flowSubject.pipe(
      map(state => state.energy)
    );
  }

  observeFocus(): Observable<number> {
    return this.flowSubject.pipe(
      map(state => (state.presence + state.coherence) / 2)
    );
  }

  // Stream management
  observe(id: string): Observable<Stream | undefined> {
    return new BehaviorSubject<Stream | undefined>(this.streams.get(id)).asObservable();
  }

  notice(id: string, type: string): void {
    const stream = this.streams.get(id);
    if (stream) {
      this.updateStream(stream);
    }
  }

  add(id: string, items: any[]): void {
    const stream = this.streams.get(id);
    if (stream) {
      this.updateStream(stream);
    }
  }

  wake(id: string): void {
    const stream = this.streams.get(id);
    if (stream) {
      this.updateStream(stream);
    }
  }

  private updateStream(stream: Stream): void {
    this.timestamp = Date.now();
    this.flowSubject.next(this);
  }

  private updateState(changes: Partial<NaturalFlow>): void {
    Object.assign(this, changes);
    this.timestamp = Date.now();
    this.flowSubject.next(this);
  }
}