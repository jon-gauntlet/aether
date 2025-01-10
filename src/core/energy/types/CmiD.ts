import { BehaviorSubject, Observable } from 'rxjs';
import { FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy, EnergyMetrics } from '../energy/types';

export enum PresenceState {
  ACTIVE = 'ACTIVE',
  FOCUSED = 'FOCUSED',
  FLOW = 'FLOW',
  RECOVERING = 'RECOVERING',
  INACTIVE = 'INACTIVE'
}

export interface PresenceMetrics {
  depth: number;
  clarity: number;
  stability: number;
  resonance: number;
  coherence: number;
}

export interface PresenceSystemState {
  state: PresenceState;
  metrics: PresenceMetrics;
  lastTransition: Date;
  history: Array<{
    timestamp: Date;
    state: PresenceState;
    metrics: PresenceMetrics;
    duration: number;
  }>;
}

export class PresenceSystem {
  private state$: BehaviorSubject<PresenceSystemState>;
  private readonly MAX_HISTORY = 100;
  private readonly STABILITY_THRESHOLD = 0.7;
  private readonly RESONANCE_THRESHOLD = 0.8;

  constructor() {
    this.state$ = new BehaviorSubject<PresenceSystemState>({
      state: PresenceState.ACTIVE,
      metrics: {
        depth: 1.0,
        clarity: 1.0,
        stability: 1.0,
        resonance: 1.0,
        coherence: 1.0
      },
      lastTransition: new Date(),
      history: []
    });
  }

  public observeState(): Observable<PresenceSystemState> {
    return this.state$.asObservable();
  }

  public updateState(
    newState: PresenceState,
    consciousness: ConsciousnessState,
    energy: Energy
  ): void {
    const currentState = this.state$.getValue();
    const now = new Date();
    const duration = now.getTime() - currentState.lastTransition.getTime();

    const metrics = this.calculateMetrics(
      consciousness,
      energy,
      currentState.metrics
    );

    this.state$.next({
      state: newState,
      metrics,
      lastTransition: now,
      history: this.addToHistory(currentState.history, {
        timestamp: now,
        state: currentState.state,
        metrics: currentState.metrics,
        duration
      })
    });
  }

  public handleFlowTransition(
    flowState: FlowState,
    consciousness: ConsciousnessState,
    energy: Energy
  ): void {
    const presenceState = this.mapFlowToPresence(flowState);
    if (presenceState) {
      this.updateState(presenceState, consciousness, energy);
    }
  }

  public synchronize(consciousness: ConsciousnessState): void {
    const currentState = this.state$.getValue();
    const metrics = this.calculateMetrics(
      consciousness,
      consciousness.energy,
      currentState.metrics
    );

    if (metrics.stability < this.STABILITY_THRESHOLD) {
      this.updateState(
        PresenceState.RECOVERING,
        consciousness,
        consciousness.energy
      );
    } else if (metrics.resonance > this.RESONANCE_THRESHOLD) {
      this.updateState(
        PresenceState.FLOW,
        consciousness,
        consciousness.energy
      );
    }
  }

  private calculateMetrics(
    consciousness: ConsciousnessState,
    energy: Energy,
    currentMetrics: PresenceMetrics
  ): PresenceMetrics {
    const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
    
    const depth = consciousness.metrics.depth * avgEnergy;
    const clarity = consciousness.metrics.clarity * (energy.mental / 3 + avgEnergy * 2/3);
    const stability = this.calculateStability(consciousness, energy, currentMetrics);
    const resonance = this.calculateResonance(consciousness, currentMetrics);
    const coherence = consciousness.metrics.coherence * stability;

    return {
      depth: Math.min(1, depth),
      clarity: Math.min(1, clarity),
      stability: Math.min(1, stability),
      resonance: Math.min(1, resonance),
      coherence: Math.min(1, coherence)
    };
  }

  private calculateStability(
    consciousness: ConsciousnessState,
    energy: Energy,
    metrics: PresenceMetrics
  ): number {
    const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
    const consciousnessStability = consciousness.flowSpace.stability;
    const currentStability = metrics.stability;

    return (
      avgEnergy * 0.3 +
      consciousnessStability * 0.4 +
      currentStability * 0.3
    );
  }

  private calculateResonance(
    consciousness: ConsciousnessState,
    metrics: PresenceMetrics
  ): number {
    const fieldResonance = consciousness.fields.reduce((sum, field) =>
      sum + field.resonance.amplitude * field.resonance.frequency, 0
    ) / Math.max(1, consciousness.fields.length);

    return (
      fieldResonance * 0.6 +
      metrics.coherence * 0.4
    );
  }

  private mapFlowToPresence(flowState: FlowState): PresenceState | null {
    switch (flowState) {
      case FlowState.FLOW:
        return PresenceState.FLOW;
      case FlowState.FOCUS:
        return PresenceState.FOCUSED;
      case FlowState.RECOVERING:
        return PresenceState.RECOVERING;
      default:
        return null;
    }
  }

  private addToHistory(
    history: Array<{
      timestamp: Date;
      state: PresenceState;
      metrics: PresenceMetrics;
      duration: number;
    }>,
    entry: {
      timestamp: Date;
      state: PresenceState;
      metrics: PresenceMetrics;
      duration: number;
    }
  ): Array<{
    timestamp: Date;
    state: PresenceState;
    metrics: PresenceMetrics;
    duration: number;
  }> {
    const updatedHistory = [...history, entry];
    if (updatedHistory.length > this.MAX_HISTORY) {
      return updatedHistory.slice(-this.MAX_HISTORY);
    }
    return updatedHistory;
  }
} 