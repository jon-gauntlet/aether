import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Stream {
  id: string;
  depth: number;      // Inner depth of being
  stillness: number;  // Inner quietude
  presence: number;   // True presence
  resonance: number;  // Harmony with others
  clarity: number;    // Clear perception
}

export interface River {
  streams: Stream[];
  depth: number;
  stillness: number;
  presence: number;
  resonance: number;
  harmony: number;    // Overall divine harmony
}

export class Flow {
  private streams = new Map<string, BehaviorSubject<Stream>>();
  
  constructor() {
    // Initialize with natural rhythms
    setInterval(() => this.tend(), 1000);
  }

  private tend() {
    this.streams.forEach(subject => {
      const stream = subject.value;
      
      // Natural cycles of presence and stillness
      const presence = Math.max(0, stream.presence - 0.05);
      const stillness = Math.min(1, stream.stillness + (1 - presence) * 0.1);
      
      // Depth follows stillness but maintains continuity
      const depth = (stream.depth * 3 + stillness) / 4;
      
      // Clarity emerges from stillness and depth
      const clarity = (stream.clarity * 2 + (stillness + depth) / 2) / 3;
      
      // Resonance flows naturally between streams
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
    // Base resonance decays naturally
    const natural = Math.max(0, stream.resonance - 0.03);
    
    // Find nearby streams
    const others = Array.from(this.streams.values())
      .map(s => s.value)
      .filter(s => s.id !== stream.id);
    
    if (others.length === 0) return natural;
    
    // Calculate resonance with other streams
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