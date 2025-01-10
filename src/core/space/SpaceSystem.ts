import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Stream, PresenceType } from '../types/stream';
import { FlowEngine } from './FlowEngine';
import { createStream } from './flow';

export class SpaceSystem {
  private streams = new Map<string, BehaviorSubject<Stream>>();
  private flow = new FlowEngine();

  create(id: string): void {
    const stream = createStream(id);
    this.streams.set(id, new BehaviorSubject(stream));
  }

  observe(id: string): Observable<Stream> {
    const stream = this.streams.get(id);
    if (!stream) {
      throw new Error(`No stream found for id: ${id}`);
    }
    return stream.asObservable();
  }

  updatePresence(id: string, type: PresenceType): void {
    const stream = this.streams.get(id);
    if (!stream) return;

    const current = stream.getValue();
    const metrics = current.metrics;
    const resonance = current.resonance;

    switch (type) {
      case 'natural':
        metrics.presence = 0.8;
        resonance.harmony = 0.8;
        break;
      case 'guided':
        metrics.presence = 0.9;
        resonance.harmony = 0.9;
        break;
      case 'resonant':
        metrics.presence = 1.0;
        resonance.harmony = 1.0;
        break;
    }

    stream.next({
      ...current,
      type,
      metrics,
      resonance,
      timestamp: Date.now()
    });
  }

  destroy(id: string): void {
    const stream = this.streams.get(id);
    if (stream) {
      stream.complete();
      this.streams.delete(id);
    }
  }
}