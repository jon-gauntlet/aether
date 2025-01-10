import { Observable, BehaviorSubject, merge } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';

interface Stream {
  id: string;
  still: number;     // Inner stillness
  awake: number;     // Watchfulness
  near: string[];    // Connected streams
  signs: any[];      // Context
}

interface Flow {
  streams: Map<string, Stream>;
  still: number;     // Overall stillness
  awake: number;     // Overall watchfulness
}

export class NaturalFlow {
  private state: BehaviorSubject<Flow>;
  private streams = new Map<string, BehaviorSubject<Stream>>();
  
  constructor() {
    this.state = new BehaviorSubject<Flow>({
      streams: new Map(),
      still: 1,
      awake: 1
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
      still: 1,
      awake: 1,
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
        awake: Math.min(1, stream.awake + 0.2),
        still: Math.max(0, stream.still - 0.1)
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
          still: Math.min(1, stream.still + 0.02),
          awake: Math.max(0.3, stream.awake - 0.02)
        });
      }
    });
    
    const streams = Array.from(current.streams.values());
    const still = streams.reduce((sum, s) => sum + s.still, 0) / streams.length || 1;
    const awake = streams.reduce((sum, s) => sum + s.awake, 0) / streams.length || 1;
    
    this.state.next({
      ...current,
      still,
      awake
    });
  }

  private watch() {
    const current = this.state.value;
    const streams = Array.from(current.streams.values());
    
    for (let i = 0; i < streams.length; i++) {
      for (let j = i + 1; j < streams.length; j++) {
        const a = streams[i];
        const b = streams[j];
        
        if (a.awake > 0.7 && b.awake > 0.7 && 
            a.still > 0.3 && b.still > 0.3) {
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
          still: Math.min(1, streamA.still + 0.1)
        });
      }
      
      if (!streamB.near.includes(a)) {
        subjectB.next({
          ...streamB,
          near: [...streamB.near, a],
          still: Math.min(1, streamB.still + 0.1)
        });
      }
    }
  }

  see(): Observable<Flow> {
    return this.state.asObservable();
  }

  look(id: string): Observable<Stream | undefined> {
    const subject = this.streams.get(id);
    return subject ? subject.asObservable() : new Observable();
  }
} 