import { 
  FlowState, 
  FlowStats, 
  EnergyMetrics, 
  Pattern 
} from './types/base';

export class FlowEngine {
  private state: FlowState;
  private energy: EnergyMetrics;
  private metrics: FlowStats;
  private patterns: Pattern[] = [];

  updateState(newState: FlowState): void {
    if (this.state?.protection > 0) {
      return; // Prevent state changes during protected flow
    }
    this.state = { ...newState };
    this.recordPattern();
  }

  getState(): FlowState {
    return { ...this.state };
  }

  getEnergy(): EnergyMetrics {
    return { ...this.energy };
  }

  getMetrics(): FlowStats {
    return { ...this.metrics };
  }

  updateEnergy(metrics: EnergyMetrics): void {
    this.energy = { ...metrics };
    this.adjustProtection();
  }

  updateMetrics(metrics: FlowStats): void {
    this.metrics = { ...metrics };
  }

  private adjustProtection(): void {
    if (this.energy.current < this.energy.max * 0.2) {
      this.state.protection = 1;
    } else {
      this.state.protection = 0;
    }
  }

  private recordPattern(): void {
    const pattern: Pattern = {
      id: `${Date.now()}`,
      type: 'flow',
      frequency: 1,
      success: this.metrics.focus > 80 ? 1 : 0
    };
    this.patterns.push(pattern);
    this.prunePatterns();
  }

  private prunePatterns(): void {
    // Keep only last 100 patterns
    if (this.patterns.length > 100) {
      this.patterns = this.patterns.slice(-100);
    }
  }

  getPatterns(): Pattern[] {
    return [...this.patterns];
  }

  isInFlow(): boolean {
    return this.metrics?.focus > 80;
  }

  async enterFlow(depth: number, isProtected: boolean): Promise<void> {
    this.state.protection = isProtected ? 1 : 0;
  }

  async exitFlow(active: boolean, isProtected: boolean): Promise<void> {
    this.state.protection = isProtected ? 1 : 0;
  }
}