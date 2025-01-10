import { Observable, BehaviorSubject, merge } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';

interface Stream {
  id: string;
  depth: number;      // Current depth
  warmth: number;     // Current activity
  links: string[];    // Connected streams
  context: any[];     // Environmental context
}

interface Flow {
  streams: Map<string, Stream>;
  depth: number;      // Overall depth
  warmth: number;     // Overall warmth
}

export class NaturalFlow {
  private state: BehaviorSubject<Flow>;
  private streams = new Map<string, BehaviorSubject<Stream>>();
  
  constructor() {
    this.state = new BehaviorSubject<Flow>({
      streams: new Map(),
      depth: 0,
      warmth: 0
    });
    
    this.start();
  }

  private start() {
    setInterval(() => this.cool(), 100);
    setInterval(() => this.connect(), 250);
  }

  introduceThought(id: string, context: any[] = []) {
    const stream: Stream = {
      id,
      depth: 0,
      warmth: 1,
      links: [],
      context
    };
    
    const subject = new BehaviorSubject<Stream>(stream);
    this.streams.set(id, subject);
    
    const current = this.state.value;
    current.streams.set(id, stream);
    this.state.next(current);
  }

  heatThought(id: string) {
    const subject = this.streams.get(id);
    if (subject) {
      const stream = subject.value;
      subject.next({
        ...stream,
        warmth: Math.min(1, stream.warmth + 0.2)
      });
    }
  }

  private cool() {
    const current = this.state.value;
    
    current.streams.forEach((stream, id) => {
      const subject = this.streams.get(id);
      if (subject) {
        subject.next({
          ...stream,
          warmth: stream.warmth * 0.98
        });
      }
    });
    
    const streams = Array.from(current.streams.values());
    const warmth = streams.reduce((sum, s) => sum + s.warmth, 0) / streams.length || 0;
    
    this.state.next({
      ...current,
      warmth
    });
  }

  private connect() {
    const current = this.state.value;
    const streams = Array.from(current.streams.values());
    
    for (let i = 0; i < streams.length; i++) {
      for (let j = i + 1; j < streams.length; j++) {
        const a = streams[i];
        const b = streams[j];
        
        if (a.warmth > 0.7 && b.warmth > 0.7) {
          this.link(a.id, b.id);
        }
      }
    }
  }

  private link(a: string, b: string) {
    const subjectA = this.streams.get(a);
    const subjectB = this.streams.get(b);
    
    if (subjectA && subjectB) {
      const streamA = subjectA.value;
      const streamB = subjectB.value;
      
      if (!streamA.links.includes(b)) {
        subjectA.next({
          ...streamA,
          links: [...streamA.links, b],
          depth: Math.min(1, streamA.depth + 0.1)
        });
      }
      
      if (!streamB.links.includes(a)) {
        subjectB.next({
          ...streamB,
          links: [...streamB.links, a],
          depth: Math.min(1, streamB.depth + 0.1)
        });
      }
    }
  }

  watch(): Observable<Flow> {
    return this.state.asObservable();
  }

  observe(id: string): Observable<Stream | undefined> {
    const subject = this.streams.get(id);
    return subject ? subject.asObservable() : new Observable();
  }
} 