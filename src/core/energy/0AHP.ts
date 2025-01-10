import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import {
  ConsciousnessState,
  NaturalFlow,
  EnergyState,
  FlowSpace,
  isCoherent,
  isProtected,
  isFlowing
} from '../types/consciousness';

export class StateManager {
  private state$: BehaviorSubject<ConsciousnessState>;

  constructor(initialState: ConsciousnessState) {
    this.state$ = new BehaviorSubject<ConsciousnessState>(initialState);
  }

  // Flow Management
  updateFlow(flow: Partial<NaturalFlow>): void {
    const currentState = this.state$.value;
    this.state$.next({
      ...currentState,
      flow: {
        ...currentState.flow,
        ...flow
      }
    });
  }

  // Energy Management
  updateEnergy(energy: Partial<EnergyState>): void {
    const currentState = this.state$.value;
    this.state$.next({
      ...currentState,
      energy: {
        ...currentState.energy,
        ...energy
      }
    });
  }

  // Space Management
  updateSpace(spaceId: string, updates: Partial<FlowSpace>): void {
    const currentState = this.state$.value;
    const spaceIndex = currentState.spaces.findIndex(s => s.id === spaceId);
    
    if (spaceIndex >= 0) {
      const updatedSpaces = [...currentState.spaces];
      updatedSpaces[spaceIndex] = {
        ...updatedSpaces[spaceIndex],
        ...updates
      };
      
      this.state$.next({
        ...currentState,
        spaces: updatedSpaces
      });
    }
  }

  // Protection Systems
  purifyState(): void {
    const currentState = this.state$.value;
    
    // Maintain flow coherence
    if (!isCoherent(currentState.flow)) {
      this.updateFlow({
        coherence: Math.min(currentState.flow.coherence + 0.1, 1),
        presence: Math.min(currentState.flow.presence + 0.1, 1)
      });
    }
    
    // Protect energy
    if (!isProtected(currentState.energy)) {
      this.updateEnergy({
        protection: Math.min(currentState.energy.protection + 0.1, 1),
        stability: Math.min(currentState.energy.stability + 0.1, 1)
      });
    }
    
    // Maintain space flow
    currentState.spaces.forEach(space => {
      if (!isFlowing(space)) {
        this.updateSpace(space.id, {
          flow: {
            ...space.flow,
            rhythm: Math.min(space.flow.rhythm + 0.1, 1),
            resonance: Math.min(space.flow.resonance + 0.1, 1)
          }
        });
      }
    });
  }

  // Observation Systems
  observeState(): Observable<ConsciousnessState> {
    return this.state$.asObservable();
  }

  observeFlow(): Observable<NaturalFlow> {
    return this.state$.pipe(
      map(state => state.flow),
      distinctUntilChanged()
    );
  }

  observeEnergy(): Observable<EnergyState> {
    return this.state$.pipe(
      map(state => state.energy),
      distinctUntilChanged()
    );
  }

  observeSpace(id: string): Observable<FlowSpace | undefined> {
    return this.state$.pipe(
      map(state => state.spaces.find(s => s.id === id)),
      distinctUntilChanged()
    );
  }
} 