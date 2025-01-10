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

  observeState(): Observable<ConsciousnessState> {
    return this.state$.asObservable();
  }

  observeEnergy(): Observable<EnergyState> {
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

  updateFlow(nextFlow: NaturalFlow) {
    const current = this.state$.value;
    this.state$.next({
      ...current,
      flow: {
        ...current.flow,
        ...nextFlow
      }
    });
  }

  updateEnergy(nextEnergy: EnergyState) {
    const current = this.state$.value;
    this.state$.next({
      ...current,
      energy: nextEnergy
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