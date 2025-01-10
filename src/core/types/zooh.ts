import { BehaviorSubject, Observable } from 'rxjs';
import { ConsciousnessState, MindSpace, Resonance, NaturalFlow, EnergyState, FlowState, Field } from '../types/base';
import { createDefaultField } from '../factories/field';
import { createEmptyNaturalFlow } from '../factories/flow';

export interface Presence {
  type: string;
  intensity: number;
}

export interface Depth {
  presence: number;
  stillness: number;
  clarity: number;
}

export interface Protection {
  coherence: number;
  flexibility: number;
  recovery: number;
}

export class PresenceSystem {
  private state: BehaviorSubject<ConsciousnessState>;

  constructor() {
    const initialState: ConsciousnessState = {
      id: 'system',
      type: 'individual',
      space: {
        id: 'root',
        type: 'natural',
        metrics: {
          depth: 0.8,
          harmony: 0.8,
          energy: 0.8,
          presence: 0.8,
          resonance: 0.8,
          coherence: 0.8,
          rhythm: 0.8
        },
        resonance: {
          frequency: 0.8,
          amplitude: 0.8,
          harmony: 0.8,
          field: createDefaultField(),
          essence: 0.8
        },
        depth: 0.8,
        protection: {
          level: 0.8,
          strength: 0.8,
          resilience: 0.8,
          adaptability: 0.8,
          field: createDefaultField()
        },
        connections: [],
        flow: createEmptyNaturalFlow(),
        timestamp: Date.now()
      },
      spaces: [],
      resonance: {
        frequency: 0.8,
        amplitude: 0.8,
        harmony: 0.8,
        field: createDefaultField(),
        essence: 0.8
      },
      depth: 0.8,
      protection: {
        level: 0.8,
        strength: 0.8,
        resilience: 0.8,
        adaptability: 0.8,
        field: createDefaultField()
      },
      energy: {
        level: 0.8,
        capacity: 0.8,
        quality: 0.8,
        stability: 0.8,
        protection: 0.8,
        resonance: {
          frequency: 0.8,
          amplitude: 0.8,
          harmony: 0.8,
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

  evolve(presence: Presence): ConsciousnessState {
    const current = this.state.getValue();
    const resonance = current.resonance.harmony + (presence.intensity * 0.1);
    const depth = current.depth + (presence.intensity * 0.1);
    const patterns = ['natural', 'guided', 'emergent'];

    const newState: ConsciousnessState = {
      ...current,
      resonance: {
        ...current.resonance,
        harmony: resonance
      },
      depth,
      patterns,
      timestamp: Date.now()
    };

    this.state.next(newState);
    return newState;
  }

  protect(depth: Depth): Protection {
    return {
      coherence: depth.presence * 0.8,
      flexibility: 1 - (depth.stillness * 0.5),
      recovery: 0.5 + (depth.clarity * 0.1)
    };
  }

  private updateState(changes: Partial<ConsciousnessState>): void {
    const current = this.state.getValue();
    this.state.next({
      ...current,
      ...changes,
      timestamp: Date.now()
    });
  }
}