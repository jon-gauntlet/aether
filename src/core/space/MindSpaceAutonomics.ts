import { MindSpace } from '../types/base';
import { AutonomicSystem, AutonomicState } from './AutonomicSystem';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map, filter } from 'rxjs/operators';

export class MindSpaceAutonomics {
  private autonomic: AutonomicSystem;
  private mindSpace: MindSpace;
  private readonly MONITOR_INTERVAL = 5000; // 5 seconds

  constructor(mindSpace: MindSpace) {
    this.mindSpace = mindSpace;
    this.autonomic = new AutonomicSystem();
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    // Regular vitality monitoring
    interval(this.MONITOR_INTERVAL).subscribe(() => {
      this.autonomic.monitorVitality(this.mindSpace);
      this.checkPatterns();
    });
  }

  private checkPatterns(): void {
    const patterns = this.autonomic.recognizePattern(this.mindSpace);
    patterns.forEach(pattern => {
      // Learn from successful patterns
      if (this.isPatternSuccessful(pattern)) {
        this.autonomic.learnFromSuccess(pattern, this.calculateEffectiveness(pattern));
      }
    });
  }

  private isPatternSuccessful(pattern: string): boolean {
    switch (pattern) {
      case 'deep_focus':
        return this.mindSpace.metrics.depth > 0.8 && 
               this.mindSpace.metrics.presence > 0.7;
      case 'flow_state':
        return this.mindSpace.metrics.harmony > 0.8 && 
               this.mindSpace.metrics.energy > 0.7;
      case 'peak_performance':
        return this.mindSpace.metrics.energy > 0.8 && 
               this.mindSpace.metrics.coherence > 0.7;
      default:
        return false;
    }
  }

  private calculateEffectiveness(pattern: string): number {
    const metrics = this.mindSpace.metrics;
    switch (pattern) {
      case 'deep_focus':
        return (metrics.depth + metrics.presence) / 2;
      case 'flow_state':
        return (metrics.harmony + metrics.energy) / 2;
      case 'peak_performance':
        return (metrics.energy + metrics.coherence) / 2;
      default:
        return 0;
    }
  }

  // Public Interface
  public getAutonomicState(): AutonomicState {
    return this.autonomic.getCurrentState();
  }

  public observeAutonomicMetrics(): Observable<AutonomicState> {
    return new BehaviorSubject(this.autonomic.getCurrentState()).asObservable();
  }
} 