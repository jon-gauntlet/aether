import { BehaviorSubject, Observable } from 'rxjs';
import { MindSpace, Resonance, Protection, Field } from '../types/base';
import { createDefaultField } from '../factories/field';

export interface AutonomicMetrics {
  vitality: number;      // Overall system health
  adaptation: number;    // Learning effectiveness
  resilience: number;    // Recovery capability
  efficiency: number;    // Resource utilization
}

export interface AutonomicState {
  metrics: AutonomicMetrics;
  patterns: Map<string, number>;
  learnings: Map<string, any>;
  optimizations: Set<string>;
}

export class AutonomicSystem {
  private state: BehaviorSubject<AutonomicState>;
  private readonly VITALITY_THRESHOLD = 0.7;
  private readonly ADAPTATION_RATE = 0.1;

  constructor() {
    this.state = new BehaviorSubject<AutonomicState>({
      metrics: {
        vitality: 1,
        adaptation: 1,
        resilience: 1,
        efficiency: 1
      },
      patterns: new Map(),
      learnings: new Map(),
      optimizations: new Set()
    });
  }

  // Self-Awareness
  public monitorVitality(mindSpace: MindSpace): void {
    const metrics = mindSpace.metrics;
    const vitality = (
      metrics.energy * 0.3 +
      metrics.presence * 0.3 +
      metrics.harmony * 0.2 +
      metrics.coherence * 0.2
    );

    if (vitality < this.VITALITY_THRESHOLD) {
      this.initiateRecovery(mindSpace);
    }
  }

  // Self-Healing
  private initiateRecovery(mindSpace: MindSpace): void {
    const current = this.state.value;
    const recovery = {
      ...current,
      metrics: {
        ...current.metrics,
        resilience: Math.min(1, current.metrics.resilience + this.ADAPTATION_RATE)
      }
    };
    this.state.next(recovery);
  }

  // Self-Optimization
  public learnFromSuccess(pattern: string, effectiveness: number): void {
    const current = this.state.value;
    current.patterns.set(pattern, effectiveness);
    current.optimizations.add(`learned_${pattern}_${Date.now()}`);
    this.state.next(current);
  }

  // Pattern Recognition
  public recognizePattern(mindSpace: MindSpace): string[] {
    const patterns: string[] = [];
    if (mindSpace.metrics.depth > 0.8) patterns.push('deep_focus');
    if (mindSpace.metrics.harmony > 0.8) patterns.push('flow_state');
    if (mindSpace.metrics.energy > 0.8) patterns.push('peak_performance');
    return patterns;
  }

  // Metrics Observation
  public observeMetrics(): Observable<AutonomicMetrics> {
    return new BehaviorSubject(this.state.value.metrics).asObservable();
  }

  // State Management
  public getCurrentState(): AutonomicState {
    return this.state.value;
  }
} 