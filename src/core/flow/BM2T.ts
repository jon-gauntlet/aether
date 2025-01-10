import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NaturalFlow, Stream, PresenceType } from '../types';

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
    const stream = this.streams.get(id);
    if (stream) {
      const current = stream.value;
      stream.next({
        ...current,
        presenceType,
        lastActivity: Date.now()
      });
      this.updateResonance();
    }
  }

  public tend() {
    const now = Date.now();
    this.streams.forEach((subject, id) => {
      const stream = subject.value;
      if (stream.lastActivity) {
        const timeSinceActivity = now - stream.lastActivity;
        const presenceDecay = this.getPresenceDecay(stream.presenceType);
        const stillnessGrowth = this.getStillnessGrowth(stream.presenceType);

        const flow: NaturalFlow = {
          ...stream.flow,
          presence: Math.max(0, stream.flow.presence - presenceDecay * timeSinceActivity / 1000),
          harmony: Math.min(1, stream.flow.harmony + stillnessGrowth * timeSinceActivity / 1000)
        };

        subject.next({
          ...stream,
          flow
        });
      }
    });
    this.updateResonance();
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

  private calculateResonance(a: Stream, b: Stream): number {
    let resonance = 0;

    // Base resonance from presence
    resonance += Math.min(a.flow.presence, b.flow.presence) * 0.5;

    // Type affinity
    if (a.presenceType && b.presenceType) {
      if (a.presenceType === b.presenceType) {
        resonance += 0.3;
      } else if (
        (a.presenceType === 'writing' && b.presenceType === 'reading') ||
        (a.presenceType === 'reading' && b.presenceType === 'writing') ||
        (a.presenceType === 'thinking' && b.presenceType === 'listening') ||
        (a.presenceType === 'listening' && b.presenceType === 'thinking')
      ) {
        resonance += 0.2;
      }
    }

    // Harmony contribution
    resonance += Math.min(a.flow.harmony, b.flow.harmony) * 0.2;

    return Math.min(1, resonance);
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