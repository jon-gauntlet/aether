import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { ConsciousnessState, Connection, FlowSpace } from '../types';

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
    energy: 0.5,
    spaces: []
  });

  observeState(): Observable<ConsciousnessState> {
    return this.state$.asObservable();
  }

  observeEnergy(): Observable<number> {
    return this.state$.pipe(
      map(state => state.energy),
      distinctUntilChanged()
    );
  }

  observeSpace(id: string): Observable<FlowSpace | undefined> {
    return this.state$.pipe(
      map(state => state.spaces.find((s: FlowSpace) => s.id === id)),
      distinctUntilChanged()
    );
  }

  updateEnergy(value: number) {
    const current = this.state$.value;
    this.state$.next({
      ...current,
      energy: value
    });
  }

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
} 
} 