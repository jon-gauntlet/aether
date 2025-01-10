import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NaturalFlow, Flow } from '../types/consciousness';
import { Stream, PresenceType, FlowState } from '../types/stream';
import { createEmptyNaturalFlow } from '../factories/flow';
import { FlowEngine } from './FlowEngine';

export { FlowEngine, Flow, Stream, PresenceType, FlowState };

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