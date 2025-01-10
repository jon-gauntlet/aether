import { BehaviorSubject, Observable } from 'rxjs';
import { Energy, EnergyMetrics, EnergyState } from './types';
import { FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';

export interface EnergySystemState {
  energy: Energy;
  metrics: EnergyMetrics;
  state: EnergyState;
  lastUpdate: Date;
  history: Array<{
    timestamp: Date;
    energy: Energy;
    metrics: EnergyMetrics;
    state: EnergyState;
  }>;
}

export class EnergySystem {
  private state$: BehaviorSubject<EnergySystemState>;
  private readonly MAX_HISTORY = 100;
  private readonly RECOVERY_RATE = 0.05;
  private readonly DEPLETION_RATE = 0.1;
  private readonly OPTIMAL_THRESHOLD = 0.8;
  private readonly STABLE_THRESHOLD = 0.6;
  private readonly RECOVERY_THRESHOLD = 0.4;

  constructor() {
    this.state$ = new BehaviorSubject<EnergySystemState>({
      energy: {
        mental: 1.0,
        physical: 1.0,
        emotional: 1.0
      },
      metrics: {
        efficiency: 1.0,
        sustainability: 1.0,
        recovery: 1.0,
        adaptability: 1.0,
        stability: 1.0
      },
      state: EnergyState.OPTIMAL,
      lastUpdate: new Date(),
      history: []
    });
  }

  public observeEnergy(): Observable<Energy> {
    return new BehaviorSubject(this.state$.getValue().energy).asObservable();
  }

  public observeState(): Observable<EnergySystemState> {
    return this.state$.asObservable();
  }

  public updateEnergy(updates: Partial<Energy>): void {
    const currentState = this.state$.getValue();
    const updatedEnergy = {
      ...currentState.energy,
      ...updates
    };

    const metrics = this.calculateMetrics(updatedEnergy, currentState.metrics);
    const state = this.determineState(updatedEnergy, metrics);

    this.state$.next({
      ...currentState,
      energy: updatedEnergy,
      metrics,
      state,
      lastUpdate: new Date(),
      history: this.addToHistory(currentState.history, {
        timestamp: new Date(),
        energy: updatedEnergy,
        metrics,
        state
      })
    });
  }

  public handleFlowTransition(
    newState: FlowState,
    consciousness: ConsciousnessState
  ): void {
    const currentState = this.state$.getValue();
    const energyImpact = this.calculateFlowImpact(newState, consciousness);
    
    this.updateEnergy({
      mental: Math.max(0, Math.min(1, currentState.energy.mental + energyImpact.mental)),
      physical: Math.max(0, Math.min(1, currentState.energy.physical + energyImpact.physical)),
      emotional: Math.max(0, Math.min(1, currentState.energy.emotional + energyImpact.emotional))
    });
  }

  public recover(duration: number): void {
    const currentState = this.state$.getValue();
    const recoveryAmount = this.RECOVERY_RATE * duration * currentState.metrics.recovery;

    this.updateEnergy({
      mental: Math.min(1, currentState.energy.mental + recoveryAmount),
      physical: Math.min(1, currentState.energy.physical + recoveryAmount),
      emotional: Math.min(1, currentState.energy.emotional + recoveryAmount)
    });
  }

  public deplete(intensity: number): void {
    const currentState = this.state$.getValue();
    const depletionAmount = this.DEPLETION_RATE * intensity;

    this.updateEnergy({
      mental: Math.max(0, currentState.energy.mental - depletionAmount),
      physical: Math.max(0, currentState.energy.physical - depletionAmount),
      emotional: Math.max(0, currentState.energy.emotional - depletionAmount)
    });
  }

  private calculateMetrics(
    energy: Energy,
    currentMetrics: EnergyMetrics
  ): EnergyMetrics {
    const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
    
    const efficiency = Math.min(1, avgEnergy * 1.2);
    const sustainability = avgEnergy * currentMetrics.stability;
    const recovery = Math.max(0.2, avgEnergy);
    const adaptability = currentMetrics.adaptability * (avgEnergy > 0.5 ? 1.1 : 0.9);
    const stability = this.calculateStability(energy, currentMetrics);

    return {
      efficiency,
      sustainability,
      recovery,
      adaptability: Math.min(1, adaptability),
      stability
    };
  }

  private calculateStability(energy: Energy, metrics: EnergyMetrics): number {
    const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
    const energyVariance = Math.sqrt(
      Math.pow(energy.mental - avgEnergy, 2) +
      Math.pow(energy.physical - avgEnergy, 2) +
      Math.pow(energy.emotional - avgEnergy, 2)
    ) / 3;

    const baseStability = 1 - energyVariance;
    const sustainabilityFactor = metrics.sustainability * 0.3;
    const recoveryFactor = metrics.recovery * 0.2;

    return Math.max(0, Math.min(1,
      baseStability * 0.5 +
      sustainabilityFactor +
      recoveryFactor
    ));
  }

  private calculateFlowImpact(
    flowState: FlowState,
    consciousness: ConsciousnessState
  ): Energy {
    const baseImpact = {
      mental: -0.05,
      physical: -0.05,
      emotional: -0.05
    };

    const flowSpaceStability = consciousness.flowSpace.stability;
    const stabilityFactor = flowSpaceStability > 0.7 ? 1.2 : 0.8;

    switch (flowState) {
      case FlowState.FLOW:
        return {
          mental: baseImpact.mental * 0.5 * stabilityFactor,
          physical: baseImpact.physical * 0.7 * stabilityFactor,
          emotional: baseImpact.emotional * 0.3 * stabilityFactor
        };
      case FlowState.RECOVERING:
        return {
          mental: Math.abs(baseImpact.mental) * 0.3,
          physical: Math.abs(baseImpact.physical) * 0.3,
          emotional: Math.abs(baseImpact.emotional) * 0.3
        };
      case FlowState.FOCUS:
        return {
          mental: baseImpact.mental * 0.8 * stabilityFactor,
          physical: baseImpact.physical * 0.4 * stabilityFactor,
          emotional: baseImpact.emotional * 0.6 * stabilityFactor
        };
      default:
        return baseImpact;
    }
  }

  private determineState(energy: Energy, metrics: EnergyMetrics): EnergyState {
    const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;

    if (avgEnergy >= this.OPTIMAL_THRESHOLD && metrics.stability >= this.OPTIMAL_THRESHOLD) {
      return EnergyState.OPTIMAL;
    } else if (avgEnergy >= this.STABLE_THRESHOLD && metrics.stability >= this.STABLE_THRESHOLD) {
      return EnergyState.STABLE;
    } else if (avgEnergy >= this.RECOVERY_THRESHOLD) {
      return EnergyState.RECOVERING;
    } else {
      return EnergyState.DEPLETED;
    }
  }

  private addToHistory(
    history: Array<{
      timestamp: Date;
      energy: Energy;
      metrics: EnergyMetrics;
      state: EnergyState;
    }>,
    entry: {
      timestamp: Date;
      energy: Energy;
      metrics: EnergyMetrics;
      state: EnergyState;
    }
  ): Array<{
    timestamp: Date;
    energy: Energy;
    metrics: EnergyMetrics;
    state: EnergyState;
  }> {
    const updatedHistory = [...history, entry];
    if (updatedHistory.length > this.MAX_HISTORY) {
      return updatedHistory.slice(-this.MAX_HISTORY);
    }
    return updatedHistory;
  }
} 