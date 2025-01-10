import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Stream {
  id: string;
  depth: number;
  stillness: number;
  presence: number;
  resonance: number;
  clarity: number;
}

export interface River {
  streams: Stream[];
  depth: number;
  stillness: number;
  presence: number;
  resonance: number;
}

export class Flow {
  private streams = new Map<string, BehaviorSubject<Stream>>();
  private lastTend = Date.now();
  
  constructor() {
    timer(0, 1000).subscribe(() => {
      const now = Date.now();
      const delta = (now - this.lastTend) / 1000;
      this.lastTend = now;
      this.tend(delta);
    });
  }

  private tend(delta: number) {
    this.streams.forEach(subject => {
      const stream = subject.value;
      
      // Natural presence cycles
      const presence = Math.max(0, stream.presence - 0.05 * delta);
      const stillness = Math.min(1, stream.stillness + (1 - presence) * 0.1 * delta);
      
      // Depth and clarity
      const depth = (stream.depth * 3 + stillness) / 4;
      const clarity = (stream.clarity * 2 + (stillness + depth) / 2) / 3;
      
      // Resonance between streams
      const resonance = this.calculateResonance(stream);
      
      subject.next({
        ...stream,
        presence,
        stillness,
        depth,
        clarity,
        resonance
      });
    });
  }

  private calculateResonance(stream: Stream): number {
    const natural = Math.max(0, stream.resonance - 0.03);
    
    const others = Array.from(this.streams.values())
      .map(s => s.value)
      .filter(s => s.id !== stream.id);
    
    if (others.length === 0) return natural;
    
    const shared = others.reduce((sum, other) => {
      const presenceMatch = 1 - Math.abs(stream.presence - other.presence);
      const depthMatch = 1 - Math.abs(stream.depth - other.depth);
      return sum + (presenceMatch + depthMatch) / 2;
    }, 0) / others.length;
    
    return Math.min(1, (natural + shared) / 2);
  }

  observe(id: string): Observable<Stream | undefined> {
    return this.getStream(id).pipe(
      map(stream => stream || undefined)
    );
  }

  notice(id: string) {
    const subject = this.getStream(id);
    const stream = subject.value;
    
    subject.next({
      ...stream,
      presence: Math.min(1, stream.presence + 0.2),
      stillness: Math.max(0, stream.stillness - 0.1),
      resonance: Math.min(1, stream.resonance + 0.1)
    });
  }

  private getStream(id: string): BehaviorSubject<Stream> {
    let subject = this.streams.get(id);
    if (!subject) {
      subject = new BehaviorSubject<Stream>({
        id,
        depth: 0,
        stillness: 0,
        presence: 0,
        resonance: 0,
        clarity: 0
      });
      this.streams.set(id, subject);
    }
    return subject;
  }
} 