import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';

export type PresenceType = 'reading' | 'writing' | 'thinking' | 'listening';

export interface Stream {
  id: string;
  depth: number;
  stillness: number;
  presence: number;
  resonance: number;
  clarity: number;
  presenceType?: PresenceType;
  lastActivity: number;
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
    const now = Date.now();
    this.streams.forEach(subject => {
      const stream = subject.value;
      
      // Natural presence cycles
      const timeSinceActivity = (now - stream.lastActivity) / 1000;
      const presenceDecay = this.getPresenceDecay(timeSinceActivity, stream.presenceType);
      const presence = Math.max(0, stream.presence - presenceDecay * delta);
      
      // Stillness grows differently based on presence type
      const stillnessGrowth = this.getStillnessGrowth(stream.presenceType);
      const stillness = Math.min(1, stream.stillness + (1 - presence) * stillnessGrowth * delta);
      
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

  private getPresenceDecay(timeSinceActivity: number, type?: PresenceType): number {
    const baseDecay = 0.05;
    if (!type) return baseDecay;

    // Different presence types have different decay patterns
    switch (type) {
      case 'reading':
        return baseDecay * (timeSinceActivity > 5 ? 2 : 0.7);
      case 'writing':
        return baseDecay * (timeSinceActivity > 10 ? 1.5 : 0.5);
      case 'thinking':
        return baseDecay * 0.8; // Thinking presence decays more slowly
      case 'listening':
        return baseDecay * (timeSinceActivity > 3 ? 2.5 : 0.6);
      default:
        return baseDecay;
    }
  }

  private getStillnessGrowth(type?: PresenceType): number {
    const baseGrowth = 0.1;
    if (!type) return baseGrowth;

    // Different activities cultivate stillness differently
    switch (type) {
      case 'reading':
        return baseGrowth * 1.2;  // Reading builds stillness steadily
      case 'writing':
        return baseGrowth * 0.8;  // Writing is more active
      case 'thinking':
        return baseGrowth * 1.5;  // Thinking builds stillness quickly
      case 'listening':
        return baseGrowth * 1.3;  // Listening builds good stillness
      default:
        return baseGrowth;
    }
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
      const typeMatch = stream.presenceType && other.presenceType && 
        this.getPresenceTypeAffinity(stream.presenceType, other.presenceType);
      
      return sum + (presenceMatch + depthMatch + (typeMatch || 0)) / (typeMatch ? 3 : 2);
    }, 0) / others.length;
    
    return Math.min(1, (natural + shared) / 2);
  }

  private getPresenceTypeAffinity(a: PresenceType, b: PresenceType): number {
    // Natural affinities between different types of presence
    const affinities: Record<PresenceType, Record<PresenceType, number>> = {
      reading: {
        reading: 0.7,    // Shared reading builds moderate resonance
        writing: 0.4,    // Reading while another writes is less connected
        thinking: 0.9,   // Reading and thinking resonate strongly
        listening: 0.5
      },
      writing: {
        reading: 0.4,
        writing: 0.3,    // Multiple writers need more independence
        thinking: 0.6,
        listening: 0.2
      },
      thinking: {
        reading: 0.9,
        writing: 0.6,
        thinking: 1.0,   // Shared contemplation builds strong resonance
        listening: 0.8
      },
      listening: {
        reading: 0.5,
        writing: 0.2,
        thinking: 0.8,
        listening: 0.9   // Shared listening builds strong resonance
      }
    };
    
    return affinities[a]?.[b] ?? 0.5;
  }

  observe(id: string): Observable<Stream | undefined> {
    return this.getStream(id).pipe(
      map(stream => stream || undefined)
    );
  }

  notice(id: string, type?: PresenceType) {
    const subject = this.getStream(id);
    const stream = subject.value;
    
    subject.next({
      ...stream,
      presence: Math.min(1, stream.presence + 0.2),
      stillness: Math.max(0, stream.stillness - 0.1),
      resonance: Math.min(1, stream.resonance + 0.1),
      presenceType: type ?? stream.presenceType,
      lastActivity: Date.now()
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
        clarity: 0,
        lastActivity: Date.now()
      });
      this.streams.set(id, subject);
    }
    return subject;
  }
} 