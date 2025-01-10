import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NaturalFlow, FlowMetrics, NaturalFlowType } from '../types/base';
import { Stream } from '../types/stream';

export class FlowEngine implements NaturalFlow {
  private flowSubject: BehaviorSubject<NaturalFlow>;
  protected streams = new Map<string, Stream>();
  private streamSubjects = new Map<string, BehaviorSubject<Stream | undefined>>();

  type: NaturalFlowType = 'natural';
  metrics: FlowMetrics;
  presence = 0.8;
  harmony = 0.8;
  rhythm = 0.8;
  resonance = 0.8;
  coherence = 0.8;
  depth = 0.8;
  energy = 0.8;
  timestamp = Date.now();

  constructor(initialState?: Partial<NaturalFlow>) {
    this.type = initialState?.type ?? 'natural';
    this.metrics = {
      depth: initialState?.depth ?? 0.8,
      harmony: initialState?.harmony ?? 0.8,
      energy: initialState?.energy ?? 0.8,
      presence: initialState?.presence ?? 0.8,
      resonance: initialState?.resonance ?? 0.8,
      coherence: initialState?.coherence ?? 0.8,
      rhythm: initialState?.rhythm ?? 0.8,
    };

    this.flowSubject = new BehaviorSubject<NaturalFlow>(this.getCurrentState());
  }

  private getCurrentState(): NaturalFlow {
    return {
      type: this.type,
      metrics: { ...this.metrics },
      presence: this.presence,
      harmony: this.harmony,
      rhythm: this.rhythm,
      resonance: this.resonance,
      coherence: this.coherence,
      depth: this.depth,
      energy: this.energy,
      timestamp: this.timestamp
    };
  }

  setMode(mode: NaturalFlowType): void {
    this.type = mode;
    this.timestamp = Date.now();
    this.flowSubject.next(this.getCurrentState());
  }

  observeState(): Observable<NaturalFlow> {
    return this.flowSubject.asObservable();
  }

  observeDepth(): Observable<number> {
    return this.flowSubject.pipe(
      map(state => state.depth),
    );
  }

  observeEnergy(): Observable<number> {
    return this.flowSubject.pipe(
      map(state => state.energy),
    );
  }

  observeFocus(): Observable<number> {
    return this.flowSubject.pipe(
      map(state => (state.presence + state.coherence) / 2),
    );
  }

  observe(id: string): Observable<Stream | undefined> {
    if (!this.streamSubjects.has(id)) {
      this.streamSubjects.set(id, new BehaviorSubject<Stream | undefined>(undefined));
    }
    return this.streamSubjects.get(id)!.asObservable();
  }

  notice(id: string, type: string): void {
    const stream = this.streams.get(id);
    if (stream) {
      stream.lastNotice = type;
      this.updateStream(id, stream);
    }
  }

  add(id: string, items: any[]): void {
    const stream: Stream = {
      id,
      items,
      lastNotice: undefined,
      lastWake: Date.now()
    };
    this.streams.set(id, stream);
    this.updateStream(id, stream);
  }

  wake(id: string): void {
    const stream = this.streams.get(id);
    if (stream) {
      stream.lastWake = Date.now();
      this.updateStream(id, stream);
    }
  }

  private updateStream(id: string, stream: Stream): void {
    this.timestamp = Date.now();
    const subject = this.streamSubjects.get(id);
    if (subject) {
      subject.next(stream);
    } else {
      this.streamSubjects.set(id, new BehaviorSubject<Stream | undefined>(stream));
    }
    this.flowSubject.next(this.getCurrentState());
  }

  private updateState(changes: Partial<NaturalFlow>): void {
    Object.assign(this, changes);
    this.timestamp = Date.now();
    this.flowSubject.next(this.getCurrentState());
  }
}