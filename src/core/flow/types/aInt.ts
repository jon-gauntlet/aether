import { BehaviorSubject, Observable } from 'rxjs';
import { NaturalFlow, Flow, Resonance } from '../types/base';
import { Stream } from '../types/stream';
import { createDefaultField } from '../factories/field';
import { createEmptyNaturalFlow } from '../factories/flow';
import { FlowEngine } from './FlowEngine';

export function createStream(id: string): Stream {
  return {
    id,
    type: 'natural',
    metrics: {
      depth: 0.8,
      harmony: 0.8,
      energy: 0.8,
      presence: 0.8,
      resonance: 0.8,
      coherence: 0.8,
      rhythm: 0.8
    },
    resonance: {
      frequency: 0.8,
      amplitude: 0.8,
      harmony: 0.8,
      field: createDefaultField(),
      essence: 0.8
    },
    timestamp: Date.now()
  };
}

export { FlowEngine };
export type { Flow, Stream, PresenceType, FlowState };

export class FlowManager {
  private streams = new Map<string, Stream>();

  enter(id: string): void {
    const existing = this.streams.get(id);
    if (!existing) {
      const flow = createEmptyNaturalFlow();
      const stream: Stream = {
        id,
        flow,
        depth: 1,
        stillness: 1,
        resonance: 1,
        presence: 1,
        clarity: 1,
        lastActivity: Date.now()
      };
      this.streams.set(id, stream);
    }
  }

  // ... rest of implementation ...
}