import { Observable, BehaviorSubject } from 'rxjs';
import { ConsciousnessState, MindSpace, Resonance, NaturalFlow, EnergyState, FlowState } from '../types/consciousness';
import { createNaturalFlow } from '../factories/flow';

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
      type: 'individual',
      space,
      spaces: [],
      connections: [],
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
        essence: 0.8
      },
      depth: 0.8,
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
      },
      energy: {
        level: 0.8,
        quality: 0.8,
        stability: 0.8,
        protection: 0.8
      },
      flow: createNaturalFlow({
        presence: 0.8,
        harmony: 0.8,
        rhythm: 0.8,
        resonance: 0.8,
        coherence: 0.8
      })
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