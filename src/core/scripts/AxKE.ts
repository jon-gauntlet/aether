import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FlowState, FlowType } from '../types/flow';
import { Stream, StreamId } from '../types/stream';

export class FlowEngine {
  private stateSubject: BehaviorSubject<FlowState>;
  private streamSubjects = new Map<StreamId, BehaviorSubject<Stream | undefined>>();
  private streams = new Map<StreamId, Stream>();
  private validTypes = ['natural', 'guided', 'resonant'] as const;
  private _timestamp: number;
  private _type: FlowType = 'natural';
  private _metrics = {
    depth: 0.8,
    harmony: 0.8,
    energy: 0.8,
    resonance: 0.8,
    rhythm: 0.8,
    presence: 0.8,
    coherence: 0.8
  };

  constructor(initialState?: Partial<FlowState>) {
    this._timestamp = Date.now();
    this._type = initialState?.type ?? 'natural';
    this._metrics = {
      depth: initialState?.depth ?? 0.8,
      harmony: initialState?.harmony ?? 0.8,
      energy: initialState?.energy ?? 0.8,
      resonance: initialState?.resonance ?? 0.8,
      rhythm: initialState?.rhythm ?? 0.8,
      presence: initialState?.presence ?? 0.8,
      coherence: initialState?.coherence ?? 0.8
    };

    this.stateSubject = new BehaviorSubject<FlowState>({
      type: this._type,
      depth: this._metrics.depth,
      energy: this._metrics.energy,
      focus: (this._metrics.presence + this._metrics.coherence) / 2,
      harmony: this._metrics.harmony,
      resonance: this._metrics.resonance,
      rhythm: this._metrics.rhythm,
      presence: this._metrics.presence,
      coherence: this._metrics.coherence,
      timestamp: this._timestamp
    });
  }

  public get type(): FlowType {
    return this._type;
  }

  public get metrics() {
    return { ...this._metrics };
  }

  public get timestamp(): number {
    return this._timestamp;
  }

  private updateTimestamp(): void {
    const now = Date.now();
    this._timestamp = now > this._timestamp ? now + 1 : this._timestamp + 1;
  }

  public setMode(type: FlowType): void {
    if (!this.validTypes.includes(type)) {
      throw new Error(`Invalid flow type: ${type}`);
    }

    this.updateTimestamp();
    this._type = type;
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      type,
      timestamp: this._timestamp
    });
  }

  public observeState(): Observable<FlowState> {
    return this.stateSubject.asObservable();
  }

  public observeDepth(): Observable<number> {
    return this.stateSubject.pipe(
      map(state => state.depth)
    );
  }

  public observeEnergy(): Observable<number> {
    return this.stateSubject.pipe(
      map(state => state.energy)
    );
  }

  public observeFocus(): Observable<number> {
    return this.stateSubject.pipe(
      map(state => state.focus)
    );
  }

  public observe(id: StreamId): Observable<Stream | undefined> {
    if (!this.streamSubjects.has(id)) {
      this.streamSubjects.set(id, new BehaviorSubject<Stream | undefined>(undefined));
    }
    return this.streamSubjects.get(id)!.asObservable();
  }

  public add(id: StreamId, items: any[]): void {
    this.updateTimestamp();
    const stream: Stream = {
      id,
      type: this.type,
      timestamp: this._timestamp
    };
    this.streams.set(id, stream);
    const subject = this.streamSubjects.get(id);
    if (subject) {
      subject.next(stream);
    } else {
      this.streamSubjects.set(id, new BehaviorSubject<Stream | undefined>(stream));
    }
  }

  public notice(id: StreamId, message: string): void {
    this.updateTimestamp();
    const stream = this.streams.get(id);
    if (stream) {
      const updatedStream: Stream = {
        ...stream,
        type: 'active',
        timestamp: this._timestamp
      };
      this.streams.set(id, updatedStream);
      const subject = this.streamSubjects.get(id);
      if (subject) {
        subject.next(updatedStream);
      }
    }
  }

  public wake(id: StreamId): void {
    this.updateTimestamp();
    const stream = this.streams.get(id);
    if (stream) {
      const updatedStream: Stream = {
        ...stream,
        timestamp: this._timestamp
      };
      this.streams.set(id, updatedStream);
      const subject = this.streamSubjects.get(id);
      if (subject) {
        subject.next(updatedStream);
      }
    }
  }

  public updateDepth(depth: number): void {
    this.updateTimestamp();
    this._metrics.depth = depth;
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      depth,
      timestamp: this._timestamp
    });
  }

  public updateEnergy(energy: number): void {
    this.updateTimestamp();
    this._metrics.energy = energy;
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      energy,
      timestamp: this._timestamp
    });
  }
}