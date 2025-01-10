import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';
import { ConsciousnessState, SystemMeta, Flow, Field, Resonance, FlowState } from '../types/consciousness';
import { FlowEngine } from '../experience/FlowEngine';

export class StateManager {
  private state$: BehaviorSubject<ConsciousnessState>;
  private flow: Flow;

  constructor(private readonly meta: SystemMeta) {
    this.flow = new FlowEngine();
    this.state$ = new BehaviorSubject<ConsciousnessState>(this.createInitialState());
  }

  private createInitialState(): ConsciousnessState {
    return {
      id: 'root',
      type: 'individual',
      space: {
        id: 'main',
        resonance: {
          frequency: this.meta.baseFrequency,
          amplitude: this.meta.baseAmplitude,
          harmony: this.meta.baseHarmony,
          field: this.createField(),
          essence: this.meta.baseHarmony
        },
        depth: 1,
        connections: []
      },
      spaces: [],
      connections: [],
      resonance: {
        frequency: this.meta.baseFrequency,
        amplitude: this.meta.baseAmplitude,
        harmony: this.meta.baseHarmony,
        field: this.createField(),
        essence: this.meta.baseHarmony
      },
      depth: 1,
      protection: {
        strength: this.meta.baseProtection.strength,
        level: this.meta.baseProtection.resilience,
        field: this.createField(),
        resilience: this.meta.baseProtection.resilience,
        adaptability: this.meta.baseProtection.adaptability
      },
      energy: {
        level: 1,
        quality: 1,
        stability: 1,
        protection: 1
      },
      flow: this.flow
    };
  }

  private createField(): Field {
    return {
      center: { x: 0, y: 0, z: 0 },
      radius: 1,
      strength: 1,
      waves: []
    };
  }

  // Public methods
  observe(): Observable<ConsciousnessState> {
    return this.state$.asObservable();
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

  updateState(update: Partial<ConsciousnessState>): void {
    const current = this.state$.getValue();
    this.state$.next({
      ...current,
      ...update
    });
  }

  destroy(): void {
    this.state$.complete();
  }
}