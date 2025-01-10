import { Observable, BehaviorSubject } from 'rxjs';
import { MindSpace, Resonance, Connection } from '../types/consciousness';

export interface SpaceState extends MindSpace {
  id: string;
  resonance: Resonance;
  connections: Connection[];
}

export class MindSpaceSystem {
  private spaces = new Map<string, BehaviorSubject<SpaceState>>();

  createSpace(id: string): SpaceState {
    const initialState: SpaceState = {
      id,
      resonance: {
        frequency: 0.8,
        amplitude: 0.9,
        harmony: 0.8,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 0.8,
          waves: []
        }
      },
      connections: []
    };
    const space = new BehaviorSubject<SpaceState>(initialState);
    this.spaces.set(id, space);
    return initialState;
  }

  observe(id: string): Observable<SpaceState> {
    const space = this.spaces.get(id);
    if (!space) {
      throw new Error(`No mind space found for id: ${id}`);
    }
    return space.asObservable();
  }

  connect(sourceId: string, targetId: string): void {
    const sourceSpace = this.spaces.get(sourceId);
    const targetSpace = this.spaces.get(targetId);

    if (!sourceSpace || !targetSpace) {
      throw new Error('One or both spaces not found');
    }

    const connection: Connection = {
      id: `${sourceId}_${targetId}`,
      sourceId,
      targetId,
      strength: 0.8,
      resonance: {
        frequency: 0.8,
        amplitude: 0.9,
        harmony: 0.8,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 0.8,
          waves: []
        }
      }
    };

    // Update source space
    const sourceState = sourceSpace.getValue();
    sourceSpace.next({
      ...sourceState,
      connections: [...sourceState.connections, connection]
    });

    // Update target space
    const targetState = targetSpace.getValue();
    targetSpace.next({
      ...targetState,
      connections: [...targetState.connections, connection]
    });
  }
} 