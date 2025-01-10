import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { EnergyState } from '../../types/base';
import { v4 as uuidv4 } from 'uuid';

export type { EnergyState };

export class EnergySystem {
  private states$ = new BehaviorSubject<Map<string, EnergyState>>(new Map());
  
  private readonly BASE_RECOVERY_RATE = 0.1;
  private readonly BASE_DECAY_RATE = 0.05;
  private readonly EFFICIENCY_BOOST = 1.2;
  private readonly EFFICIENCY_PENALTY = 0.8;

  constructor() {
    this.initializeEnergyTracking();
  }

  private initializeEnergyTracking() {
    setInterval(() => {
      this.updateEnergies();
    }, 60 * 1000); // Every minute
  }

  private updateEnergies() {
    const states = this.states$.value;
    const updated = new Map(states);

    for (const [id, state] of states) {
      updated.set(id, this.evolveEnergyState(state));
    }

    this.states$.next(updated);
  }

  private evolveEnergyState(state: EnergyState): EnergyState {
    const timeDelta = (Date.now() - state.lastTransition) / (60 * 1000); // Minutes
    let energyDelta = 0;

    switch (state.phase) {
      case 'charging':
        energyDelta = this.calculateRecovery(state, timeDelta);
        break;
      case 'discharging':
        energyDelta = -this.calculateDecay(state, timeDelta);
        break;
      case 'stable':
        energyDelta = 0;
        break;
    }

    const newEnergy = Math.max(0, Math.min(state.max, state.current + energyDelta));
    const efficiency = this.calculateEfficiency(state, newEnergy);

    return {
      ...state,
      current: newEnergy,
      efficiency,
      lastTransition: Date.now()
    };
  }

  private calculateRecovery(state: EnergyState, minutes: number): number {
    const baseRecovery = state.recoveryRate * minutes;
    const efficiencyFactor = state.efficiency >= 0.8 ? this.EFFICIENCY_BOOST : this.EFFICIENCY_PENALTY;
    return baseRecovery * efficiencyFactor;
  }

  private calculateDecay(state: EnergyState, minutes: number): number {
    const baseDecay = state.decayRate * minutes;
    const efficiencyFactor = state.efficiency >= 0.8 ? this.EFFICIENCY_PENALTY : this.EFFICIENCY_BOOST;
    return baseDecay * efficiencyFactor;
  }

  private calculateEfficiency(state: EnergyState, newEnergy: number): number {
    const energyRatio = newEnergy / state.max;
    const timeFactor = Math.min(1, (Date.now() - state.lastTransition) / (8 * 60 * 60 * 1000)); // 8 hours max
    return Math.min(1, (energyRatio * 0.7 + timeFactor * 0.3) * state.efficiency);
  }

  public createState(): EnergyState {
    const state: EnergyState = {
      current: 1,
      max: 1,
      efficiency: 1,
      lastTransition: Date.now(),
      recoveryRate: this.BASE_RECOVERY_RATE,
      decayRate: this.BASE_DECAY_RATE,
      phase: 'stable'
    };

    const states = this.states$.value;
    const id = uuidv4();
    states.set(id, state);
    this.states$.next(states);

    return state;
  }

  public pause(state: EnergyState) {
    const states = this.states$.value;
    states.set(state.lastTransition.toString(), {
      ...state,
      phase: 'stable',
      lastTransition: Date.now()
    });
    this.states$.next(states);
  }

  public resume(state: EnergyState) {
    const states = this.states$.value;
    states.set(state.lastTransition.toString(), {
      ...state,
      phase: 'discharging',
      lastTransition: Date.now()
    });
    this.states$.next(states);
  }

  public observeState(stateId: string): Observable<EnergyState | undefined> {
    return this.states$.pipe(
      map(states => states.get(stateId)),
      distinctUntilChanged()
    );
  }
} 