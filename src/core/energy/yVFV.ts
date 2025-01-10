import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { ConsciousnessState, Connection, FlowSpace, NaturalFlow, EnergyState } from '../types/consciousness';

export class StateManager {
  private state$ = new BehaviorSubject<ConsciousnessState>({
    id: 'root',
    type: 'individual',
    flow: {
      rhythm: 0.5,
      resonance: 0.5,
      coherence: 0.5,
      presence: 0.5,
      harmony: 0.5
    },
    depth: 0,
    connections: [],
    energy: {
      level: 0.5,
      quality: 0.5,
      stability: 0.5,
      protection: 0.5
    },
    spaces: []
  });

  // Core State Observation
  observeState(): Observable<ConsciousnessState> {
    return this.state$.asObservable();
  }

  observeEnergy(): Observable<EnergyState> {
    return this.state$.pipe(
      map(state => state.energy),
      distinctUntilChanged()
    );
  }

  observeFlow(): Observable<NaturalFlow> {
    return this.state$.pipe(
      map(state => state.flow),
      distinctUntilChanged()
    );
  }

  observeSpace(id: string): Observable<FlowSpace | undefined> {
    return this.state$.pipe(
      map(state => state.spaces.find((s: FlowSpace) => s.id === id)),
      distinctUntilChanged()
    );
  }

  observeSpaces(): Observable<FlowSpace[]> {
    return this.state$.pipe(
      map(state => state.spaces),
      distinctUntilChanged()
    );
  }

  // State Updates
  updateFlow(nextFlow: Partial<NaturalFlow>) {
    const current = this.state$.value;
    this.state$.next({
      ...current,
      flow: {
        ...current.flow,
        ...nextFlow
      }
    });
  }

  updateEnergy(nextEnergy: Partial<EnergyState>) {
    const current = this.state$.value;
    this.state$.next({
      ...current,
      energy: {
        ...current.energy,
        ...nextEnergy
      }
    });
  }

  updateSpace(id: string, space: Partial<FlowSpace>) {
    const current = this.state$.value;
    const spaceIndex = current.spaces.findIndex(s => s.id === id);
    
    if (spaceIndex >= 0) {
      const updatedSpaces = [...current.spaces];
      updatedSpaces[spaceIndex] = {
        ...updatedSpaces[spaceIndex],
        ...space
      };
      
      this.state$.next({
        ...current,
        spaces: updatedSpaces
      });
    }
  }

  // Space Management
  createSpace(type: FlowSpace['type']): string {
    const current = this.state$.value;
    const id = crypto.randomUUID();
    
    const newSpace: FlowSpace = {
      id,
      type,
      flow: {
        rhythm: 1,
        resonance: 1,
        coherence: 1,
        presence: 1,
        harmony: 1
      },
      depth: 0,
      connections: []
    };

    this.state$.next({
      ...current,
      spaces: [...current.spaces, newSpace]
    });

    return id;
  }

  // Connection Management
  addConnection(connection: Connection) {
    const current = this.state$.value;
    this.state$.next({
      ...current,
      connections: [...current.connections, connection]
    });
  }

  removeConnection(from: string, to: string) {
    const current = this.state$.value;
    this.state$.next({
      ...current,
      connections: current.connections.filter((c: Connection) => 
        !(c.from === from && c.to === to)
      )
    });
  }

  connectSpaces(sourceId: string, targetId: string) {
    const current = this.state$.value;
    const connection: Connection = {
      from: sourceId,
      to: targetId,
      type: 'resonance',
      strength: 1
    };

    // Add to global connections
    this.addConnection(connection);

    // Update space connections
    const sourceSpace = current.spaces.find(s => s.id === sourceId);
    const targetSpace = current.spaces.find(s => s.id === targetId);

    if (sourceSpace && targetSpace) {
      this.updateSpace(sourceId, {
        connections: [...sourceSpace.connections, connection]
      });
      this.updateSpace(targetId, {
        connections: [...targetSpace.connections, connection]
      });
    }
  }

  // System Management
  transition(changes: Partial<ConsciousnessState>) {
    const current = this.state$.value;
    this.state$.next({
      ...current,
      ...changes,
      flow: changes.flow ? { ...current.flow, ...changes.flow } : current.flow,
      energy: changes.energy ? { ...current.energy, ...changes.energy } : current.energy,
      spaces: changes.spaces || current.spaces,
      connections: changes.connections || current.connections
    });
  }

  destroy() {
    this.state$.complete();
  }
} 