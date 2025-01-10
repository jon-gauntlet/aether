import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Flow, NaturalFlow, Connection, NaturalFlowType } from '../types/base';
import { Stream } from '../types/stream';

export class FlowImpl implements Flow {
  private flowSubject: BehaviorSubject<NaturalFlow>;
  private streams = new Map<string, Stream>();

  type: NaturalFlowType = 'natural';
  metrics = {
    depth: 0.8,
    harmony: 0.8,
    energy: 0.8,
    presence: 0.8,
    resonance: 0.8,
    coherence: 0.8,
    rhythm: 0.8
  };
  presence: number = 0.8;
  harmony: number = 0.8;
  rhythm: number = 0.8;
  resonance: number = 0.8;
  coherence: number = 0.8;
  depth: number = 0.8;
  energy: number = 0.8;
  timestamp: number = Date.now();

  constructor() {
    this.flowSubject = new BehaviorSubject<NaturalFlow>(this);
  }

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

  connect(target: Flow): Connection {
    return {
      id: `${Date.now()}`,
      from: this.type,
      to: target.type,
      type: 'direct',
      strength: 0.8,
      quality: 0.8
    };
  }

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

  private updateStream(stream: Stream): void {
    this.timestamp = Date.now();
    this.flowSubject.next(this);
  }
}