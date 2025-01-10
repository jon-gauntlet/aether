import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NaturalFlow } from '../types/consciousness';
import { createEmptyNaturalFlow } from '../factories/flow';

export type PresenceType = 'reading' | 'writing' | 'thinking' | 'listening';
export type FlowState = 'shallow' | 'gathering' | 'deepening' | 'deep' | 'protected';

export interface Stream {
  id: string;
  flow: NaturalFlow;
  type?: PresenceType;
  lastActivity?: number;
  flowState?: FlowState;
}

export class FlowManager {
  private streams = new Map<string, Stream>();

  enter(id: string): void {
    const existing = this.streams.get(id);
    if (!existing) {
      const flow = createEmptyNaturalFlow();
      const stream: Stream = {
        id,
        flow,
        lastActivity: Date.now()
      };
      this.streams.set(id, stream);
    }
  }

  // ... rest of implementation ...
} 