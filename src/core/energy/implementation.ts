import { EnergyMetrics, EnergyState, isEnergyState } from './types';

export class EnergySystem {
  private state: EnergyState;

  constructor(initialMetrics: EnergyMetrics) {
    this.state = {
      current: initialMetrics,
      baseline: initialMetrics,
      peaks: [initialMetrics]
    };
  }

  public getCurrentState(): EnergyState {
    return this.state;
  }

  public updateMetrics(metrics: EnergyMetrics): void {
    this.state = {
      current: metrics,
      baseline: this.state.baseline,
      peaks: this.isPeak(metrics) 
        ? [...this.state.peaks, metrics]
        : this.state.peaks
    };
  }

  private isPeak(metrics: EnergyMetrics): boolean {
    return metrics.strength > this.state.current.strength &&
           metrics.resonance > this.state.current.resonance;
  }

  public validateState(): boolean {
    return isEnergyState(this.state);
  }
} 