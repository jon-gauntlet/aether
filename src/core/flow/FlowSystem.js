import { BehaviorSubject, Observable } from 'rxjs';
import { FlowState } from '../types/base';
import { Energy, EnergyMetrics } from '../energy/types';
import { ConsciousnessState } from '../types/consciousness';

export interface FlowSystemState {
  currentState: FlowState;
  metrics: {
    efficiency: number;
    stability: number;
    duration: number;
    transitions: number;
  };
  isStable: boolean;
  lastTransition: Date;
}

export class FlowSystem {
  private state$: BehaviorSubject<FlowSystemState>;
  private readonly MIN_EFFICIENCY = 0.3;
  private readonly STABILITY_THRESHOLD = 0.7;

  constructor() {
    this.state$ = new BehaviorSubject<FlowSystemState>({
      currentState: FlowState.FOCUS,
      metrics: {
        efficiency: 0.8,
        stability: 1.0,
        duration: 0,
        transitions: 0
      },
      isStable: true,
      lastTransition: new Date()
    });
  }

  public getState(): Observable<FlowSystemState> {
    return this.state$.asObservable();
  }

  public transitionTo(
    newState: FlowState,
    energy: Energy,
    metrics: EnergyMetrics
  ): boolean {
    const currentState = this.state$.getValue();
    
    if (newState === currentState.currentState) {
      return true;
    }

    const canTransition = this.canTransition(energy, metrics);
    if (!canTransition) {
      return false;
    }

    this.state$.next({
      ...currentState,
      currentState: newState,
      metrics: {
        ...currentState.metrics,
        efficiency: currentState.metrics.efficiency * 0.9,
        transitions: currentState.metrics.transitions + 1,
        stability: this.calculateStability(newState, energy, metrics)
      },
      lastTransition: new Date()
    });

    return true;
  }

  public optimize(
    targetState: FlowState,
    energy: Energy,
    metrics: EnergyMetrics
  ): boolean {
    const currentState = this.state$.getValue();
    
    if (currentState.currentState !== targetState) {
      return this.transitionTo(targetState, energy, metrics);
    }

    const newEfficiency = Math.min(1, currentState.metrics.efficiency * 1.1);
    const newStability = this.calculateStability(targetState, energy, metrics);

    this.state$.next({
      ...currentState,
      metrics: {
        ...currentState.metrics,
        efficiency: newEfficiency,
        stability: newStability,
        duration: currentState.metrics.duration + 1
      },
      isStable: newStability > this.STABILITY_THRESHOLD
    });

    return true;
  }

  public enforceRecovery(consciousness: ConsciousnessState): void {
    const currentState = this.state$.getValue();
    
    if (currentState.currentState !== FlowState.RECOVERING) {
      this.state$.next({
        ...currentState,
        currentState: FlowState.RECOVERING,
        metrics: {
          ...currentState.metrics,
          efficiency: this.MIN_EFFICIENCY,
          stability: 0.5,
          transitions: currentState.metrics.transitions + 1
        },
        isStable: false,
        lastTransition: new Date()
      });
    }
  }

  private canTransition(energy: Energy, metrics: EnergyMetrics): boolean {
    const currentState = this.state$.getValue();
    const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
    const timeSinceLastTransition = Date.now() - currentState.lastTransition.getTime();

    return (
      avgEnergy > 0.3 &&
      metrics.efficiency > this.MIN_EFFICIENCY &&
      timeSinceLastTransition > 5000 // Minimum 5 seconds between transitions
    );
  }

  private calculateStability(
    state: FlowState,
    energy: Energy,
    metrics: EnergyMetrics
  ): number {
    const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
    const sustainabilityFactor = metrics.sustainability * 0.4;
    const efficiencyFactor = metrics.efficiency * 0.3;
    const recoveryFactor = metrics.recovery * 0.3;

    const baseStability = avgEnergy * (
      sustainabilityFactor +
      efficiencyFactor +
      recoveryFactor
    );

    // Apply state-specific modifiers
    switch (state) {
      case FlowState.FLOW:
        return baseStability * 1.2; // Flow state enhances stability
      case FlowState.RECOVERING:
        return baseStability * 0.8; // Recovery state reduces stability
      case FlowState.TRANSITIONING:
        return baseStability * 0.9; // Transitions temporarily reduce stability
      default:
        return baseStability;
    }
  }
} 