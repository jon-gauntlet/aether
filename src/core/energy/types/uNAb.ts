import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NaturalFlow, FlowMetrics, NaturalFlowType, Flow } from '../types/base';
import { Stream, PresenceType } from '../types/stream';

export class FlowEngine implements Flow {
  private flowSubject: BehaviorSubject<NaturalFlow>;
  protected streams = new Map<string, Stream>();
  private streamSubjects = new Map<string, BehaviorSubject<Stream | undefined>>();
  private stateHistory: Array<NaturalFlow> = [];

  type: NaturalFlowType = 'natural';
  metrics: FlowMetrics = {
    depth: 0.8,
    harmony: 0.8,
    energy: 0.8,
    presence: 0.8,
    resonance: 0.8,
    coherence: 0.8,
    rhythm: 0.8
  };
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

    const state = { ...this };
    this.flowSubject = new BehaviorSubject<NaturalFlow>(state);
    this.stateHistory.push(state);
  }

  setMode(mode: NaturalFlowType): void {
    const now = Date.now();
    const oldType = this.type;
    
    if (oldType !== mode) {
      // Emit old state first
      const oldState = { ...this, type: oldType, timestamp: now };
      this.flowSubject.next(oldState);
      this.stateHistory.push(oldState);

      // Update and emit new state
      this.type = mode;
      this.timestamp = now + 1;
      const newState = { ...this };
      this.flowSubject.next(newState);
      this.stateHistory.push(newState);
    } else {
      this.timestamp = now + 1;
      const newState = { ...this };
      this.flowSubject.next(newState);
      this.stateHistory.push(newState);
    }
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
      const now = Date.now();
      const updatedStream: Stream = {
        ...stream,
        type: type as PresenceType,
        timestamp: now
      };
      this.timestamp = now + 1;
      this.updateStream(id, updatedStream);
    }
  }

  add(id: string, items: any[]): void {
    const now = Date.now();
    const stream: Stream = {
      id,
      type: this.type,
      metrics: { ...this.metrics },
      resonance: {
        frequency: 0,
        amplitude: 0,
        harmony: 0,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 0,
          strength: 0,
          waves: []
        },
        essence: 0
      },
      timestamp: now
    };
    this.timestamp = now + 1;
    this.streams.set(id, stream);
    this.updateStream(id, stream);
  }

  wake(id: string): void {
    const stream = this.streams.get(id);
    if (stream) {
      const now = Date.now();
      const updatedStream: Stream = {
        ...stream,
        timestamp: now
      };
      this.timestamp = now + 1;
      this.updateStream(id, updatedStream);
    }
  }

  private updateStream(id: string, stream: Stream): void {
    const now = Date.now();
    this.streams.set(id, stream);
    const subject = this.streamSubjects.get(id);
    if (subject) {
      subject.next(stream);
    } else {
      this.streamSubjects.set(id, new BehaviorSubject<Stream | undefined>(stream));
    }
    this.timestamp = now + 1;
    const newState = { ...this };
    this.flowSubject.next(newState);
    this.stateHistory.push(newState);
  }

  private updateState(changes: Partial<NaturalFlow>): void {
    const now = Date.now();
    Object.assign(this, changes);
    this.timestamp = now + 1;
    const newState = { ...this };
    this.flowSubject.next(newState);
    this.stateHistory.push(newState);
  }
}