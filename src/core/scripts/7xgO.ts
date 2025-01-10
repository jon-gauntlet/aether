import { Observable, BehaviorSubject } from 'rxjs';
import { ConsciousnessState, Resonance, Protection } from '../types/consciousness';

export interface EnergyState {
  id: string;
  resonance: Resonance;
  protection: Protection;
}

export class EnergySystem {
  private states = new Map<string, BehaviorSubject<EnergyState>>();

  initialize(id: string): EnergyState {
    const initialState: EnergyState = {
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
        },
        divine: 0.8
      },
      protection: {
        strength: 0.8,
        level: 0.8,
        resilience: 0.8,
        adaptability: 0.8,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 0.8,
          waves: []
        }
      }
    };
    const state = new BehaviorSubject<EnergyState>(initialState);
    this.states.set(id, state);
    return initialState;
  }

  observe(id: string): Observable<EnergyState> {
    const state = this.states.get(id);
    if (!state) {
      throw new Error(`No energy state found for id: ${id}`);
    }
    return state.asObservable();
  }
} 