import { Observable, BehaviorSubject } from 'rxjs';
import { ConsciousnessState, MindSpace, Resonance } from '../types/consciousness';

export interface Disturbance {
  type: 'notification';
  intensity: number;
  source: string;
  resonance: Resonance;
}

export class PresenceSystem {
  private states = new Map<string, BehaviorSubject<ConsciousnessState>>();

  enter(id: string, space: MindSpace): void {
    const initialState: ConsciousnessState = {
      id,
      space,
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
      depth: 0.8,
      protection: {
        strength: 0.8,
        level: 0.8,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 0.8,
          waves: []
        }
      }
    };
    const state = new BehaviorSubject<ConsciousnessState>(initialState);
    this.states.set(id, state);
  }

  observe(id: string): Observable<ConsciousnessState> {
    const state = this.states.get(id);
    if (!state) {
      throw new Error(`No presence state found for id: ${id}`);
    }
    return state.asObservable();
  }

  handleDisturbance(id: string, disturbance: Disturbance): boolean {
    const state = this.states.get(id);
    if (!state) {
      throw new Error(`No presence state found for id: ${id}`);
    }
    
    // Check if disturbance breaks through protection
    const currentState = state.getValue();
    return disturbance.intensity > currentState.protection.strength;
  }
} 