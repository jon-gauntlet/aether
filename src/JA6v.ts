import { BehaviorSubject, Observable } from 'rxjs';
import { ConsciousnessState, SystemMeta, Field, Resonance, FlowState, NaturalFlow } from '../types/base';
import { createDefaultField } from '../factories/field';
import { createEmptyNaturalFlow } from '../factories/flow';

export class StateManager {
  private state: BehaviorSubject<ConsciousnessState>;

  constructor(private meta: SystemMeta) {
    const initialState: ConsciousnessState = {
      id: 'system',
      type: 'individual',
      space: {
        id: 'root',
        type: 'natural',
        metrics: {
          depth: 0.8,
          harmony: meta.baseHarmony,
          energy: 0.8,
          presence: 0.8,
          resonance: 0.8,
          coherence: 0.8,
          rhythm: 0.8
        },
        resonance: {
          frequency: meta.baseFrequency,
          amplitude: meta.baseAmplitude,
          harmony: meta.baseHarmony,
          field: createDefaultField(),
          essence: 0.8
        },
        depth: 0.8,
        protection: meta.baseProtection,
        connections: [],
        flow: createEmptyNaturalFlow(),
        timestamp: Date.now()
      },
      spaces: [],
      resonance: {
        frequency: meta.baseFrequency,
        amplitude: meta.baseAmplitude,
        harmony: meta.baseHarmony,
        field: createDefaultField(),
        essence: 0.8
      },
      depth: 0.8,
      protection: meta.baseProtection,
      energy: {
        level: 0.8,
        capacity: 0.8,
        quality: 0.8,
        stability: 0.8,
        protection: 0.8,
        resonance: {
          frequency: meta.baseFrequency,
          amplitude: meta.baseAmplitude,
          harmony: meta.baseHarmony,
          field: createDefaultField(),
          essence: 0.8
        },
        field: createDefaultField(),
        flow: 0.8,
        recovery: 0.8,
        reserves: 0.8,
        timestamp: Date.now()
      },
      flow: createEmptyNaturalFlow(),
      coherence: 0.8,
      timestamp: Date.now()
    };

    this.state = new BehaviorSubject<ConsciousnessState>(initialState);
  }

  observe(): Observable<ConsciousnessState> {
    return this.state.asObservable();
  }

  observeField(): Observable<Field> {
    return new BehaviorSubject<Field>(createDefaultField()).asObservable();
  }

  updateState(changes: Partial<ConsciousnessState>): void {
    const current = this.state.getValue();
    this.state.next({
      ...current,
      ...changes,
      timestamp: Date.now()
    });
  }

  destroy(): void {
    this.state.complete();
  }
}