import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NaturalFlow as NaturalFlowType } from '../types';
import { NaturalFlow } from './NaturalFlow';

export type PresenceType = 'reading' | 'writing' | 'thinking' | 'listening';
export type FlowState = 'shallow' | 'gathering' | 'deepening' | 'deep' | 'protected';

export interface Stream {
  id: string;
  flow: NaturalFlowType;
  depth: number;
  presenceType?: PresenceType;
  lastActivity?: number;
  flowState?: FlowState;
  
  // Divine properties
  stillness: number;      // Inner stillness level
  resonance: number;      // Divine resonance
  presence: number;       // Present moment awareness
  clarity: number;        // Mental clarity
}

export interface Flow {
  stream: Stream | undefined;
  otherStreams: Stream[];
  metrics: {
    depth: number;
    harmony: number;
    energy: number;
    focus: number;
  };
  isDeep: boolean;
  isHarmonious: boolean;
  flows: string[];
  enter: (type: string) => void;
  observe: (id: string) => Observable<Stream | null>;
  observeDepth: () => Observable<number>;
  observeEnergy: () => Observable<number>;
  observeFocus: () => Observable<number>;
  notice: (id: string) => void;
  updatePresence: (type: PresenceType) => void;
}

export class FlowEngine {
  private streams: Map<string, BehaviorSubject<Stream>> = new Map();
  private resonance: BehaviorSubject<number> = new BehaviorSubject(0.5);

  public observe(id: string): Observable<Stream | null> {
    const subject = this.streams.get(id);
    return subject ? subject.asObservable() : 
      new Observable(sub => sub.next(null));
  }

  public observeResonance(): Observable<number> {
    return this.resonance.asObservable();
  }

  public notice(id: string, presenceType?: PresenceType) {
    const existing = this.streams.get(id);
    if (!existing) {
      const flow = new NaturalFlow();
      const stream: Stream = {
        id,
        flow,
        depth: 0,
        presenceType,
        lastActivity: Date.now(),
        flowState: 'shallow',
        stillness: 1,
        resonance: 0.5,
        presence: 1,
        clarity: 1
      };
      this.streams.set(id, new BehaviorSubject(stream));
    } else {
      const current = existing.value;
      existing.next({
        ...current,
        presenceType,
        lastActivity: Date.now(),
        // Adjust spiritual properties on activity
        stillness: Math.max(0.3, current.stillness - 0.1),
        presence: Math.min(1, current.presence + 0.1),
        clarity: Math.min(1, current.clarity + 0.05)
      });
    }
    this.updateResonance();
  }

  public tend() {
    const now = Date.now();
    this.streams.forEach((subject, id) => {
      const stream = subject.value;
      const elapsed = now - (stream.lastActivity || 0);
      
      if (elapsed > 30000) {
        // Natural return to stillness after 30s
        const stillnessGrowth = this.getStillnessGrowth(stream.presenceType);
        const presenceDecay = this.getPresenceDecay(stream.presenceType);
        
        subject.next({
          ...stream,
          stillness: Math.min(1, stream.stillness + stillnessGrowth),
          presence: Math.max(0.3, stream.presence - presenceDecay),
          clarity: Math.max(0.3, stream.clarity - 0.02),
          resonance: this.calculateStreamResonance(stream)
        });
      }
    });
    this.updateResonance();
  }

  private calculateStreamResonance(stream: Stream): number {
    let totalResonance = 0;
    let count = 0;
    
    this.streams.forEach((subject, id) => {
      if (id !== stream.id) {
        const other = subject.value;
        totalResonance += this.calculateResonance(stream, other);
        count++;
      }
    });
    
    return count > 0 ? totalResonance / count : 0.5;
  }

  private calculateResonance(a: Stream, b: Stream): number {
    const presenceMatch = Math.abs(a.presence - b.presence);
    const stillnessMatch = Math.abs(a.stillness - b.stillness);
    const timeMatch = Math.abs(
      (a.lastActivity || 0) - (b.lastActivity || 0)
    ) < 5000 ? 1 : 0;
    
    return Math.min(1, (
      (1 - presenceMatch) * 0.4 +
      (1 - stillnessMatch) * 0.4 +
      timeMatch * 0.2
    ));
  }

  private getPresenceDecay(type?: PresenceType): number {
    switch (type) {
      case 'reading': return 0.05;
      case 'writing': return 0.1;
      case 'thinking': return 0.15;
      case 'listening': return 0.2;
      default: return 0.1;
    }
  }

  private getStillnessGrowth(type?: PresenceType): number {
    switch (type) {
      case 'reading': return 0.1;
      case 'writing': return 0.05;
      case 'thinking': return 0.15;
      case 'listening': return 0.2;
      default: return 0.1;
    }
  }

  private updateResonance() {
    const streams = Array.from(this.streams.values()).map(s => s.value);
    if (streams.length < 2) {
      this.resonance.next(0.5);
      return;
    }

    let totalResonance = 0;
    let connections = 0;

    for (let i = 0; i < streams.length; i++) {
      for (let j = i + 1; j < streams.length; j++) {
        totalResonance += this.calculateResonance(streams[i], streams[j]);
        connections++;
      }
    }

    this.resonance.next(totalResonance / connections);
  }
} 