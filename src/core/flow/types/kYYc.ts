import { Observable, BehaviorSubject, merge } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';

interface Stream {
  id: string;
  ease: number;      // How smooth it feels
  fresh: number;     // How lively it is
  near: string[];    // Connected streams
  hints: any[];      // Little clues
}

interface River {
  streams: Map<string, Stream>;
  ease: number;      // Overall smoothness
  fresh: number;     // Overall liveliness
}

export class Flow {
  private state: BehaviorSubject<River>;
  private streams = new Map<string, BehaviorSubject<Stream>>();
  
  constructor() {
    this.state = new BehaviorSubject<River>({
      streams: new Map(),
      ease: 1,
      fresh: 1
    });
    
    this.care();
  }

  private care() {
    setInterval(() => this.rest(), 100);
    setInterval(() => this.look(), 250);
  }

  add(id: string, hints: any[] = []) {
    const stream: Stream = {
      id,
      ease: 1,
      fresh: 1,
      near: [],
      hints
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
        fresh: Math.min(1, stream.fresh + 0.2),
        ease: Math.max(0, stream.ease - 0.1)
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
          ease: Math.min(1, stream.ease + 0.02),
          fresh: Math.max(0.3, stream.fresh - 0.02)
        });
      }
    });
    
    const streams = Array.from(current.streams.values());
    const ease = streams.reduce((sum, s) => sum + s.ease, 0) / streams.length || 1;
    const fresh = streams.reduce((sum, s) => sum + s.fresh, 0) / streams.length || 1;
    
    this.state.next({
      ...current,
      ease,
      fresh
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
          ease: Math.min(1, streamA.ease + 0.1)
        });
      }
      
      if (!streamB.near.includes(a)) {
        subjectB.next({
          ...streamB,
          near: [...streamB.near, a],
          ease: Math.min(1, streamB.ease + 0.1)
        });
      }
    }
  }

  see(): Observable<River> {
    return this.state.asObservable();
  }

  peek(id: string): Observable<Stream | undefined> {
    const subject = this.streams.get(id);
    return subject ? subject.asObservable() : new Observable();
  }
} 