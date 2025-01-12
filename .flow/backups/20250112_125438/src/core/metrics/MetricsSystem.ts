import { BehaviorSubject, Observable, timer } from 'rxjs';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy, EnergyMetrics } from '../energy/types';

export interface SystemMetrics {
  energy: EnergyMetrics;
  flow: {
    stability: number;
    efficiency: number;
    duration: number;
    transitions: number;
  };
  field: {
    strength: number;
    resonance: number;
    protection: number;
    conductivity: number;
  };
  consciousness: {
    clarity: number;
    depth: number;
    coherence: number;
    integration: number;
  };
}

export interface MetricsSnapshot {
  timestamp: number;
  metrics: SystemMetrics;
  flowState: FlowState;
  activeField: Field | null;
}

export class MetricsSystem {
  private metrics$: BehaviorSubject<SystemMetrics>;
  private history: MetricsSnapshot[] = [];
  private snapshotInterval = 60000; // 1 minute

  constructor() {
    this.metrics$ = new BehaviorSubject<SystemMetrics>({
      energy: {
        efficiency: 0,
        sustainability: 0,
        recovery: 0
      },
      flow: {
        stability: 0,
        efficiency: 0,
        duration: 0,
        transitions: 0
      },
      field: {
        strength: 0,
        resonance: 0,
        protection: 0,
        conductivity: 0
      },
      consciousness: {
        clarity: 0,
        depth: 0,
        coherence: 0,
        integration: 0
      }
    });

    this.startMetricsCollection();
  }

  public updateEnergyMetrics(energy: Energy, metrics: EnergyMetrics): void {
    const currentMetrics = this.metrics$.getValue();
    this.metrics$.next({
      ...currentMetrics,
      energy: metrics
    });
  }

  public updateFlowMetrics(
    flowState: FlowState,
    stability: number,
    efficiency: number,
    duration: number
  ): void {
    const currentMetrics = this.metrics$.getValue();
    this.metrics$.next({
      ...currentMetrics,
      flow: {
        ...currentMetrics.flow,
        stability,
        efficiency,
        duration,
        transitions: currentMetrics.flow.transitions + 1
      }
    });
  }

  public updateFieldMetrics(field: Field): void {
    const currentMetrics = this.metrics$.getValue();
    this.metrics$.next({
      ...currentMetrics,
      field: {
        strength: field.strength,
        resonance: field.resonance.amplitude,
        protection: field.protection.shields,
        conductivity: field.flowMetrics.conductivity
      }
    });
  }

  public updateConsciousnessMetrics(consciousness: ConsciousnessState): void {
    const currentMetrics = this.metrics$.getValue();
    this.metrics$.next({
      ...currentMetrics,
      consciousness: consciousness.metrics
    });
  }

  public getMetrics(): Observable<SystemMetrics> {
    return this.metrics$.asObservable();
  }

  public getHistory(): MetricsSnapshot[] {
    return this.history;
  }

  public getMetricsByTimeRange(startTime: number, endTime: number): MetricsSnapshot[] {
    return this.history.filter(
      snapshot => snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
    );
  }

  private startMetricsCollection(): void {
    timer(0, this.snapshotInterval).subscribe(() => {
      const currentMetrics = this.metrics$.getValue();
      this.history.push({
        timestamp: Date.now(),
        metrics: currentMetrics,
        flowState: FlowState.FOCUS, // This should be passed in from the flow system
        activeField: null // This should be passed in from the field system
      });

      // Keep last 24 hours of metrics
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      this.history = this.history.filter(snapshot => snapshot.timestamp > dayAgo);
    });
  }
} 