import { Observable, BehaviorSubject, merge } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';

interface Stream {
  id: string;
  depth: number;     // Natural depth
  stillness: number; // Inner quiet
  presence: number;  // True presence
  resonance: number; // Natural harmony
  near: string[];    // Connected streams
  qualities: {
    clarity: number; // Clear understanding
    warmth: number;  // Natural connection
    strength: number;// Inner stability
  };
}

interface River {
  streams: Map<string, Stream>;
  depth: number;     // Overall depth
  stillness: number; // Collective quiet
  presence: number;  // Shared presence
  resonance: number; // Natural harmony
}

export class Flow {
  private state: BehaviorSubject<River>;
  private streams = new Map<string, BehaviorSubject<Stream>>();
  
  constructor() {
    this.state = new BehaviorSubject<River>({
      streams: new Map(),
      depth: 1,
      stillness: 1,
      presence: 1,
      resonance: 1
    });
    
    this.tend();
  }

  private tend() {
    setInterval(() => this.rest(), 100);    // Natural rest cycle
    setInterval(() => this.deepen(), 250);  // Natural deepening
    setInterval(() => this.connect(), 500); // Natural connection
  }

  add(id: string) {
    const stream: Stream = {
      id,
      depth: 1,
      stillness: 1,
      presence: 1,
      resonance: 1,
      near: [],
      qualities: {
        clarity: 1,
        warmth: 1,
        strength: 1
      }
    };
    
    const subject = new BehaviorSubject<Stream>(stream);
    this.streams.set(id, subject);
    
    const current = this.state.value;
    current.streams.set(id, stream);
    this.state.next(current);
  }

  notice(id: string) {
    const subject = this.streams.get(id);
    if (subject) {
      const stream = subject.value;
      subject.next({
        ...stream,
        presence: Math.min(1, stream.presence + 0.2),
        stillness: Math.max(0, stream.stillness - 0.1),
        qualities: {
          ...stream.qualities,
          clarity: Math.min(1, stream.qualities.clarity + 0.1)
        }
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
          stillness: Math.min(1, stream.stillness + 0.02),
          presence: Math.max(0.3, stream.presence - 0.02),
          qualities: {
            ...stream.qualities,
            clarity: Math.min(1, stream.qualities.clarity + 0.01),
            strength: Math.min(1, stream.qualities.strength + 0.01)
          }
        });
      }
    });
  }

  private look() {
    const current = this.state.value;
    const streams = Array.from(current.streams.values());
    
    for (let i = 0; i < streams.length; i++) {
      for (let j = i + 1; j < streams.length; j++) {
        const a = streams[i];
        const b = streams[j];
        
        if (a.fresh > 0.7 && b.fresh > 0.7 && 
            a.ease > 0.3 && b.ease > 0.3) {
          this.join(a.id, b.id);
        }
      }
    }
  }

  private join(a: string, b: string) {
    const subjectA = this.streams.get(a);
    const subjectB = this.streams.get(b);
    
    if (subjectA && subjectB) {
      const streamA = subjectA.value;
      const streamB = subjectB.value;
      
      if (!streamA.near.includes(b)) {
        subjectA.next({
          ...streamA,
          near: [...streamA.near, b],
          resonance: Math.min(1, streamA.resonance + 0.1),
          qualities: {
            ...streamA.qualities,
            warmth: Math.min(1, streamA.qualities.warmth + 0.1)
          }
        });
      }
      
      if (!streamB.near.includes(a)) {
        subjectB.next({
          ...streamB,
          near: [...streamB.near, a],
          resonance: Math.min(1, streamB.resonance + 0.1),
          qualities: {
            ...streamB.qualities,
            warmth: Math.min(1, streamB.qualities.warmth + 0.1)
          }
        });
      }
    }
  }

  private deepen() {
    const current = this.state.value;
    
    current.streams.forEach((stream, id) => {
      const subject = this.streams.get(id);
      if (subject) {
        subject.next({
          ...stream,
          depth: Math.min(1, stream.depth + 0.02),
          stillness: Math.min(1, stream.stillness + 0.02),
          presence: Math.max(0.3, stream.presence - 0.01),
          resonance: this.calculateResonance(stream)
        });
      }
    });
    
    const streams = Array.from(current.streams.values());
    const depth = streams.reduce((sum, s) => sum + s.depth, 0) / streams.length || 1;
    const stillness = streams.reduce((sum, s) => sum + s.stillness, 0) / streams.length || 1;
    const presence = streams.reduce((sum, s) => sum + s.presence, 0) / streams.length || 1;
    const resonance = streams.reduce((sum, s) => sum + s.resonance, 0) / streams.length || 1;
    
    this.state.next({
      ...current,
      depth,
      stillness,
      presence,
      resonance
    });
  }

  private connect() {
    const current = this.state.value;
    const streams = Array.from(current.streams.values());
    
    for (let i = 0; i < streams.length; i++) {
      for (let j = i + 1; j < streams.length; j++) {
        const a = streams[i];
        const b = streams[j];
        
        if (this.canConnect(a, b)) {
          this.join(a.id, b.id);
        }
      }
    }
  }

  private canConnect(a: Stream, b: Stream): boolean {
    return (
      a.presence > 0.7 && b.presence > 0.7 &&
      a.stillness > 0.3 && b.stillness > 0.3 &&
      a.resonance > 0.5 && b.resonance > 0.5
    );
  }

  private calculateResonance(stream: Stream): number {
    const nearby = stream.near
      .map(id => this.streams.get(id)?.value)
      .filter((s): s is Stream => s !== undefined);

    if (nearby.length === 0) return stream.resonance;

    const sharedResonance = nearby.reduce((sum, s) => sum + s.resonance, 0) / nearby.length;
    return Math.min(1, (stream.resonance + sharedResonance) / 2 + 0.1);
  }

  see(): Observable<River> {
    return this.state.asObservable();
  }

  observe(id: string): Observable<Stream | undefined> {
    const subject = this.streams.get(id);
    return subject ? subject.asObservable() : new Observable();
  }
} 