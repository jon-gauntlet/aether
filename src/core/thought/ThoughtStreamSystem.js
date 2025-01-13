import { Observable, BehaviorSubject } from 'rxjs';
import { ConsciousnessState, MindSpace, Resonance } from '../types/consciousness';

export interface ThoughtState {
  id: string;
  space: MindSpace;
  resonance: Resonance;
  depth: number;
}

export class ThoughtStreamSystem {
  private streams = new Map<string, BehaviorSubject<ThoughtState>>();

  create(id: string, space: MindSpace): void {
    const initialState: ThoughtState = {
      id,
      space,
      resonance: {
        frequency: 0.8,
        amplitude: 0.9,
        harmony: 0.8,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 0.8,
          waves: []
        },
        essence: 0.8
      },
      depth: 0.8
    };
    const stream = new BehaviorSubject<ThoughtState>(initialState);
    this.streams.set(id, stream);
  }

  observe(id: string): Observable<ThoughtState> {
    const stream = this.streams.get(id);
    if (!stream) {
      throw new Error(`No thought stream found for id: ${id}`);
    }
    return stream.asObservable();
  }
} 