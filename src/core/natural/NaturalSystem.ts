import { BehaviorSubject, Observable } from 'rxjs';
import { FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy, EnergyMetrics } from '../energy/types';

export interface NaturalMetrics {
  harmony: number;
  balance: number;
  rhythm: number;
  flow: number;
  resonance: number;
}

export interface NaturalState {
  isHarmonic: boolean;
  metrics: NaturalMetrics;
  cycles: Array<{
    timestamp: Date;
    duration: number;
    type: 'FLOW' | 'REST' | 'TRANSITION';
    metrics: NaturalMetrics;
  }>;
}

export class NaturalSystem {
  private state$: BehaviorSubject<NaturalState>;
  private readonly MAX_CYCLES = 100;
  private readonly HARMONY_THRESHOLD = 0.7;
  private readonly MIN_CYCLE_DURATION = 300000; // 5 minutes in milliseconds

  constructor() {
    this.state$ = new BehaviorSubject<NaturalState>({
      isHarmonic: true,
      metrics: {
        harmony: 1.0,
        balance: 1.0,
        rhythm: 1.0,
        flow: 1.0,
        resonance: 1.0
      },
      cycles: []
    });
  }

  public getState(): Observable<NaturalState> {
    return this.state$.asObservable();
  }

  public handleFlowTransition(
    newState: FlowState,
    consciousness: ConsciousnessState,
    energy: Energy
  ): void {
    const currentState = this.state$.getValue();
    const now = new Date();
    
    const metrics = this.calculateMetrics(
      consciousness,
      energy,
      currentState.metrics
    );

    const cycleType = this.determineCycleType(newState);
    if (cycleType) {
      this.state$.next({
        ...currentState,
        isHarmonic: this.checkHarmony(metrics),
        metrics,
        cycles: this.addCycle(currentState.cycles, {
          timestamp: now,
          duration: this.calculateCycleDuration(currentState.cycles),
          type: cycleType,
          metrics
        })
      });
    }
  }

  public synchronize(consciousness: ConsciousnessState): void {
    const currentState = this.state$.getValue();
    const metrics = this.calculateMetrics(
      consciousness,
      consciousness.energy,
      currentState.metrics
    );

    this.state$.next({
      ...currentState,
      isHarmonic: this.checkHarmony(metrics),
      metrics
    });
  }

  private calculateMetrics(
    consciousness: ConsciousnessState,
    energy: Energy,
    currentMetrics: NaturalMetrics
  ): NaturalMetrics {
    const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
    const flowSpaceStability = consciousness.flowSpace.stability;
    
    const harmony = consciousness.metrics.coherence * flowSpaceStability;
    const balance = this.calculateBalance(energy, consciousness);
    const rhythm = this.calculateRhythm(currentMetrics.rhythm, consciousness);
    const flow = consciousness.metrics.depth * avgEnergy;
    const resonance = consciousness.metrics.integration * harmony;

    return {
      harmony: Math.min(1, harmony),
      balance: Math.min(1, balance),
      rhythm: Math.min(1, rhythm),
      flow: Math.min(1, flow),
      resonance: Math.min(1, resonance)
    };
  }

  private calculateBalance(
    energy: Energy,
    consciousness: ConsciousnessState
  ): number {
    const mentalPhysicalBalance = 1 - Math.abs(energy.mental - energy.physical);
    const emotionalBalance = 1 - Math.abs(
      (energy.mental + energy.physical) / 2 - energy.emotional
    );
    const consciousnessBalance = consciousness.metrics.coherence;

    return (
      mentalPhysicalBalance * 0.4 +
      emotionalBalance * 0.3 +
      consciousnessBalance * 0.3
    );
  }

  private calculateRhythm(
    currentRhythm: number,
    consciousness: ConsciousnessState
  ): number {
    const cycles = this.state$.getValue().cycles;
    if (cycles.length < 2) return currentRhythm;

    const recentCycles = cycles.slice(-3);
    const durationVariance = this.calculateDurationVariance(recentCycles);
    const rhythmStability = 1 - Math.min(1, durationVariance / this.MIN_CYCLE_DURATION);

    return (
      rhythmStability * 0.6 +
      consciousness.metrics.flexibility * 0.4
    );
  }

  private calculateDurationVariance(cycles: Array<{
    timestamp: Date;
    duration: number;
    type: 'FLOW' | 'REST' | 'TRANSITION';
    metrics: NaturalMetrics;
  }>): number {
    const avgDuration = cycles.reduce((sum, cycle) => 
      sum + cycle.duration, 0
    ) / cycles.length;

    return Math.sqrt(
      cycles.reduce((sum, cycle) =>
        sum + Math.pow(cycle.duration - avgDuration, 2), 0
      ) / cycles.length
    );
  }

  private checkHarmony(metrics: NaturalMetrics): boolean {
    const harmonyScore = (
      metrics.harmony * 0.3 +
      metrics.balance * 0.2 +
      metrics.rhythm * 0.2 +
      metrics.flow * 0.2 +
      metrics.resonance * 0.1
    );

    return harmonyScore >= this.HARMONY_THRESHOLD;
  }

  private determineCycleType(flowState: FlowState): 'FLOW' | 'REST' | 'TRANSITION' | null {
    switch (flowState) {
      case FlowState.FLOW:
        return 'FLOW';
      case FlowState.RECOVERING:
        return 'REST';
      case FlowState.TRANSITIONING:
        return 'TRANSITION';
      default:
        return null;
    }
  }

  private calculateCycleDuration(cycles: Array<{
    timestamp: Date;
    duration: number;
    type: 'FLOW' | 'REST' | 'TRANSITION';
    metrics: NaturalMetrics;
  }>): number {
    if (cycles.length === 0) return 0;
    const lastCycle = cycles[cycles.length - 1];
    return Date.now() - lastCycle.timestamp.getTime();
  }

  private addCycle(
    cycles: Array<{
      timestamp: Date;
      duration: number;
      type: 'FLOW' | 'REST' | 'TRANSITION';
      metrics: NaturalMetrics;
    }>,
    cycle: {
      timestamp: Date;
      duration: number;
      type: 'FLOW' | 'REST' | 'TRANSITION';
      metrics: NaturalMetrics;
    }
  ): Array<{
    timestamp: Date;
    duration: number;
    type: 'FLOW' | 'REST' | 'TRANSITION';
    metrics: NaturalMetrics;
  }> {
    const updatedCycles = [...cycles, cycle];
    if (updatedCycles.length > this.MAX_CYCLES) {
      return updatedCycles.slice(-this.MAX_CYCLES);
    }
    return updatedCycles;
  }
} 