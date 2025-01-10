import { Observable, BehaviorSubject, merge } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';

interface Stream {
  id: string;
  presence: number;    // Inner presence (was still)
  harmony: number;     // Inner harmony (was awake) 
  near: string[];      // Connected streams
  signs: any[];        // Context
}

interface Flow {
  streams: Map<string, Stream>;
  presence: number;    // Overall presence
  harmony: number;    // Overall harmony
  rhythm: number;     // Natural rhythm
  resonance: number;  // Natural resonance
  coherence: number;  // Unity coherence
}

export class NaturalFlow {
  private state: BehaviorSubject<Flow>;
  private streams = new Map<string, BehaviorSubject<Stream>>();
  
  constructor() {
    this.state = new BehaviorSubject<Flow>({
      streams: new Map(),
      presence: 1,
      harmony: 1,
      rhythm: 1,
      resonance: 1,
      coherence: 1
    });
    
    this.tend();
  }

  private tend() {
    setInterval(() => this.rest(), 100);
    setInterval(() => this.watch(), 250);
  }

  add(id: string, signs: any[] = []) {
    const stream: Stream = {
      id,
      presence: 1,
      harmony: 1,
      near: [],
      signs
    };
    
    const subject = new BehaviorSubject<Stream>(stream);
    this.streams.set(id, subject);
    
    const current = this.state.value;
    current.streams.set(id, stream);
    this.state.next(current);
  }

  wake(id: string) {
    const subject = this.streams.get(id);
    if (subject) {
      const stream = subject.value;
      subject.next({
        ...stream,
        harmony: Math.min(1, stream.harmony + 0.2),
        presence: Math.max(0, stream.presence - 0.1)
      });
    }
  }

  private rest() {
    const current = this.state.value;
    
    current.streams.forEach((stream, id) => {
      const subject = this.streams.get(id);
      if (subject) {
        subject.next({
          ...stream,
          presence: Math.min(1, stream.presence + 0.02),
          harmony: Math.max(0.3, stream.harmony - 0.02)
        });
      }
    });
    
    const streams = Array.from(current.streams.values());
    const presence = streams.reduce((sum, s) => sum + s.presence, 0) / streams.length || 1;
    const harmony = streams.reduce((sum, s) => sum + s.harmony, 0) / streams.length || 1;
    
    // Calculate emergent properties
    const rhythm = Math.min(1, (presence + harmony) / 2);
    const resonance = Math.min(1, presence * harmony);
    const coherence = Math.min(1, streams.length ? 
      streams.reduce((sum, s) => sum + s.near.length, 0) / (streams.length * 2) : 1);
    
    this.state.next({
      ...current,
      presence,
      harmony,
      rhythm,
      resonance,
      coherence
    });
  }

  private watch() {
    const current = this.state.value;
    const streams = Array.from(current.streams.values());
    
    for (let i = 0; i < streams.length; i++) {
      for (let j = i + 1; j < streams.length; j++) {
        const a = streams[i];
        const b = streams[j];
        
        if (a.harmony > 0.7 && b.harmony > 0.7 && 
            a.presence > 0.3 && b.presence > 0.3) {
          this.draw(a.id, b.id);
        }
      }
    }
  }

  private draw(a: string, b: string) {
    const subjectA = this.streams.get(a);
    const subjectB = this.streams.get(b);
    
    if (subjectA && subjectB) {
      const streamA = subjectA.value;
      const streamB = subjectB.value;
      
      if (!streamA.near.includes(b)) {
        subjectA.next({
          ...streamA,
          near: [...streamA.near, b],
          presence: Math.min(1, streamA.presence + 0.1)
        });
      }
      
      if (!streamB.near.includes(a)) {
        subjectB.next({
          ...streamB,
          near: [...streamB.near, a],
          presence: Math.min(1, streamB.presence + 0.1)
        });
      }
    }
  }

  // Required interface properties
  get presence(): number { return this.state.value.presence; }
  get harmony(): number { return this.state.value.harmony; }
  get rhythm(): number { return this.state.value.rhythm; }
  get resonance(): number { return this.state.value.resonance; }
  get coherence(): number { return this.state.value.coherence; }

  see(): Observable<Flow> {
    return this.state.asObservable();
  }

  look(id: string): Observable<Stream | undefined> {
    const subject = this.streams.get(id);
    return subject ? subject.asObservable() : new Observable();
  }

  observeDepth(): Observable<number> {
    return this.state.pipe(
      map(flow => {
        // Calculate depth based on stillness and watchfulness
        const avgStill = Array.from(flow.streams.values())
          .reduce((sum, s) => sum + s.presence, 0) / flow.streams.size;
        return (avgStill + flow.presence) / 2;
      }),
      distinctUntilChanged()
    );
  }

  observeEnergy(): Observable<number> {
    return this.state.pipe(
      map(flow => {
        // Calculate energy based on watchfulness and stream count
        const avgAwake = Array.from(flow.streams.values())
          .reduce((sum, s) => sum + s.harmony, 0) / flow.streams.size;
        return (avgAwake + flow.harmony) / 2;
      }),
      distinctUntilChanged()
    );
  }

  observeFocus(): Observable<number> {
    return this.state.pipe(
      map(flow => {
        // Calculate focus based on stream connections
        const avgConnections = Array.from(flow.streams.values())
          .reduce((sum, s) => sum + s.near.length, 0) / flow.streams.size;
        return Math.min(1, avgConnections / 3); // Normalize to 0-1
      }),
      distinctUntilChanged()
    );
  }
} 