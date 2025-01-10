import { BehaviorSubject, Observable } from 'rxjs';
import { FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';

export interface ProtectionMetrics {
  resilience: number;
  sustainability: number;
  integrity: number;
  recovery: number;
}

export interface ProtectionState {
  isProtected: boolean;
  level: number;
  metrics: ProtectionMetrics;
  breaches: Array<{
    timestamp: Date;
    severity: number;
    source?: string;
  }>;
}

export class ProtectionSystem {
  private state$: BehaviorSubject<ProtectionState>;
  private readonly MAX_BREACHES = 100;
  private readonly PROTECTION_THRESHOLD = 0.7;

  constructor() {
    this.state$ = new BehaviorSubject<ProtectionState>({
      isProtected: true,
      level: 1.0,
      metrics: {
        resilience: 1.0,
        sustainability: 1.0,
        integrity: 1.0,
        recovery: 1.0
      },
      breaches: []
    });
  }

  public getState(): Observable<ProtectionState> {
    return this.state$.asObservable();
  }

  public handleStateTransition(
    newState: FlowState,
    consciousness: ConsciousnessState
  ): void {
    const currentState = this.state$.getValue();
    const flowSpaceStability = consciousness.flowSpace.stability;
    
    let protectionLevel = currentState.level;
    let metrics = { ...currentState.metrics };

    switch (newState) {
      case FlowState.FLOW:
        protectionLevel *= flowSpaceStability > 0.8 ? 1.1 : 0.9;
        metrics.sustainability *= 1.1;
        break;
      case FlowState.RECOVERING:
        protectionLevel *= 0.9;
        metrics.recovery *= 1.2;
        break;
      case FlowState.TRANSITIONING:
        protectionLevel *= 0.95;
        metrics.integrity *= 0.9;
        break;
      default:
        break;
    }

    // Normalize values
    protectionLevel = Math.min(1, Math.max(0, protectionLevel));
    metrics = {
      resilience: Math.min(1, metrics.resilience),
      sustainability: Math.min(1, metrics.sustainability),
      integrity: Math.min(1, metrics.integrity),
      recovery: Math.min(1, metrics.recovery)
    };

    this.state$.next({
      ...currentState,
      isProtected: protectionLevel >= this.PROTECTION_THRESHOLD,
      level: protectionLevel,
      metrics
    });
  }

  public handleBreach(severity: number, source?: string): void {
    const currentState = this.state$.getValue();
    const impact = Math.min(1, Math.max(0, severity));
    
    const newLevel = currentState.level * (1 - impact);
    const newMetrics = {
      resilience: currentState.metrics.resilience * (1 - impact * 0.5),
      sustainability: currentState.metrics.sustainability * (1 - impact * 0.3),
      integrity: currentState.metrics.integrity * (1 - impact * 0.7),
      recovery: currentState.metrics.recovery * (1 - impact * 0.2)
    };

    this.state$.next({
      ...currentState,
      isProtected: newLevel >= this.PROTECTION_THRESHOLD,
      level: newLevel,
      metrics: newMetrics,
      breaches: this.addBreach(currentState.breaches, {
        timestamp: new Date(),
        severity: impact,
        source
      })
    });
  }

  private addBreach(
    breaches: Array<{
      timestamp: Date;
      severity: number;
      source?: string;
    }>,
    breach: {
      timestamp: Date;
      severity: number;
      source?: string;
    }
  ): Array<{
    timestamp: Date;
    severity: number;
    source?: string;
  }> {
    const updatedBreaches = [...breaches, breach];
    if (updatedBreaches.length > this.MAX_BREACHES) {
      return updatedBreaches.slice(-this.MAX_BREACHES);
    }
    return updatedBreaches;
  }
} 