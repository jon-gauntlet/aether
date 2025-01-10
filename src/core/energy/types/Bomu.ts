import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy, EnergyMetrics } from '../energy/types';
import { EnergyPattern, PatternState } from '../pattern/types';

export interface AutonomicState {
  isActive: boolean;
  isProtected: boolean;
  isStable: boolean;
  currentPattern: EnergyPattern | null;
  metrics: {
    efficiency: number;
    sustainability: number;
    adaptability: number;
    resilience: number;
  };
}

export class AutonomicSystem {
  private state$: BehaviorSubject<AutonomicState>;
  private readonly MIN_EFFICIENCY = 0.3;
  private readonly MIN_SUSTAINABILITY = 0.4;
  private readonly STABILITY_THRESHOLD = 0.7;

  constructor() {
    this.state$ = new BehaviorSubject<AutonomicState>({
      isActive: false,
      isProtected: true,
      isStable: true,
      currentPattern: null,
      metrics: {
        efficiency: 0.8,
        sustainability: 0.8,
        adaptability: 0.7,
        resilience: 0.7
      }
    });
  }

  public getState(): Observable<AutonomicState> {
    return this.state$.asObservable();
  }

  public activate(): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      isActive: true
    });
  }

  public deactivate(): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      isActive: false,
      currentPattern: null
    });
  }

  public updatePattern(
    pattern: EnergyPattern | null,
    energy: Energy,
    metrics: EnergyMetrics
  ): void {
    const currentState = this.state$.getValue();
    
    if (!currentState.isActive) return;

    const efficiency = this.calculateEfficiency(energy, metrics);
    const sustainability = this.calculateSustainability(energy, metrics);
    const adaptability = pattern ? this.calculateAdaptability(pattern) : currentState.metrics.adaptability;
    const resilience = this.calculateResilience(energy, metrics, pattern);

    this.state$.next({
      ...currentState,
      currentPattern: pattern,
      metrics: {
        efficiency,
        sustainability,
        adaptability,
        resilience
      },
      isStable: this.checkStability(efficiency, sustainability, resilience)
    });
  }

  public handleStateTransition(
    newState: FlowState,
    energy: Energy,
    metrics: EnergyMetrics
  ): void {
    const currentState = this.state$.getValue();
    
    if (!currentState.isActive) return;

    const efficiency = this.calculateEfficiency(energy, metrics) * 0.9; // Slight penalty for transition
    const sustainability = this.calculateSustainability(energy, metrics);
    
    this.state$.next({
      ...currentState,
      metrics: {
        ...currentState.metrics,
        efficiency,
        sustainability
      },
      isStable: this.checkStability(
        efficiency,
        sustainability,
        currentState.metrics.resilience
      )
    });
  }

  public handleBreach(severity: number): void {
    const currentState = this.state$.getValue();
    
    if (!currentState.isActive) return;

    const resilienceFactor = Math.max(0, 1 - severity);
    const newResilience = currentState.metrics.resilience * resilienceFactor;
    const newEfficiency = currentState.metrics.efficiency * resilienceFactor;

    this.state$.next({
      ...currentState,
      isProtected: newResilience > this.MIN_SUSTAINABILITY,
      metrics: {
        ...currentState.metrics,
        resilience: newResilience,
        efficiency: newEfficiency
      },
      isStable: this.checkStability(
        newEfficiency,
        currentState.metrics.sustainability,
        newResilience
      )
    });
  }

  private calculateEfficiency(energy: Energy, metrics: EnergyMetrics): number {
    const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
    return Math.max(this.MIN_EFFICIENCY,
      avgEnergy * metrics.efficiency * metrics.sustainability
    );
  }

  private calculateSustainability(energy: Energy, metrics: EnergyMetrics): number {
    const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
    return Math.max(this.MIN_SUSTAINABILITY,
      avgEnergy * metrics.sustainability * metrics.recovery
    );
  }

  private calculateAdaptability(pattern: EnergyPattern): number {
    if (!pattern.evolution.history.length) return 0.7;

    const successRate = pattern.evolution.history
      .filter(h => h.success).length / pattern.evolution.history.length;

    const stateBonus = pattern.state === PatternState.STABLE ? 0.2 :
      pattern.state === PatternState.PROTECTED ? 0.3 : 0;

    return Math.min(1, successRate + stateBonus);
  }

  private calculateResilience(
    energy: Energy,
    metrics: EnergyMetrics,
    pattern: EnergyPattern | null
  ): number {
    const baseResilience = metrics.recovery * 0.4 + metrics.sustainability * 0.4;
    const patternBonus = pattern?.state === PatternState.PROTECTED ? 0.2 : 0;
    const energyFactor = (energy.mental + energy.physical + energy.emotional) / 3;

    return Math.min(1, baseResilience + patternBonus) * energyFactor;
  }

  private checkStability(
    efficiency: number,
    sustainability: number,
    resilience: number
  ): boolean {
    const stabilityScore = (
      efficiency * 0.4 +
      sustainability * 0.3 +
      resilience * 0.3
    );

    return stabilityScore > this.STABILITY_THRESHOLD;
  }
} 