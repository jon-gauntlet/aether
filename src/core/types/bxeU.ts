import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';
import { ConsciousnessState, SystemMeta, Flow, Field, Resonance } from '../types/consciousness';

export interface State {
  resonance?: Resonance;
  flow?: Flow;
  coherence?: number;
  energy?: number;
  presence?: number;
  depth?: {
    level: number;
    clarity: number;
    stillness: number;
    presence: number;
  };
}

export class StateManager {
  private state$: BehaviorSubject<State>;
  private meta: SystemMeta;

  constructor(meta: SystemMeta) {
    this.meta = meta;
    this.state$ = new BehaviorSubject<State>(this.createInitialState());
  }

  private createInitialState(): State {
    return {
      resonance: {
        frequency: this.meta.baseFrequency,
        amplitude: this.meta.baseAmplitude,
        harmony: this.meta.baseHarmony,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 1,
          waves: []
        },
        divine: this.meta.baseHarmony
      },
      flow: {
        pace: 1,
        adaptability: 1,
        emergence: 1,
        balance: 0.8
      },
      coherence: 1,
      energy: 1,
      presence: 1,
      depth: {
        level: 1,
        clarity: 1,
        stillness: 1,
        presence: 1
      }
    };
  }

  observe(): Observable<State> {
    return this.state$.pipe(distinctUntilChanged());
  }

  observeFlow(): Observable<Flow> {
    return this.state$.pipe(
      map(state => state.flow),
      filter((flow): flow is Flow => flow !== undefined),
      distinctUntilChanged()
    );
  }

  observeField(): Observable<Field> {
    return this.state$.pipe(
      map(state => state.resonance?.field),
      filter((field): field is Field => field !== undefined),
      distinctUntilChanged()
    );
  }

  transition(update: Partial<State>): void {
    const currentState = this.state$.getValue();
    const newState = this.calculateNewState(currentState, update);
    this.state$.next(newState);
  }

  private calculateNewState(current: State, update: Partial<State>): State {
    const newState = { ...current };

    if (update.resonance) {
      newState.resonance = {
        ...current.resonance,
        ...update.resonance,
        harmony: Math.min(1, (current.resonance?.harmony || 0) + 0.1)
      };
    }

    if (update.flow) {
      newState.flow = {
        ...current.flow,
        ...update.flow,
        balance: Math.min(1, (current.flow?.balance || 0) + 0.1)
      };
    }

    if (update.depth) {
      newState.depth = {
        ...current.depth,
        ...update.depth
      };
    }

    if (update.energy !== undefined) {
      newState.energy = update.energy;
    }

    if (update.presence !== undefined) {
      newState.presence = update.presence;
    }

    if (update.coherence !== undefined) {
      newState.coherence = Math.min(1, Math.max(0, update.coherence));
    }

    return newState;
  }

  destroy(): void {
    this.state$.complete();
  }
} 