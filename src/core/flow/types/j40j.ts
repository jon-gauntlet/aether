import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Stream {
  id: string;
  depth: number;
  stillness: number;
  presence: number;
  resonance: number;
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
  
  constructor() {
    // Initialize with natural rhythms
    setInterval(() => this.tend(), 1000);
  }

  private tend() {
    this.streams.forEach(subject => {
      const stream = subject.value;
      // Natural decay of presence
      const presence = Math.max(0, stream.presence - 0.05);
      // Stillness increases with lack of presence
      const stillness = Math.min(1, stream.stillness + (1 - presence) * 0.1);
      // Depth follows stillness
      const depth = (stream.depth * 3 + stillness) / 4;
      // Resonance decays naturally
      const resonance = Math.max(0, stream.resonance - 0.03);
      
      subject.next({
        ...stream,
        presence,
        stillness,
        depth,
        resonance
      });
    });
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
        resonance: 0
      });
      this.streams.set(id, subject);
    }
    return subject;
  }
} 