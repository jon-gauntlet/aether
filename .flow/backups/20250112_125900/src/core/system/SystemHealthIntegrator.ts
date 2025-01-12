import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { DevOptimizer } from '../aaa/DevOptimizer';
import { ProtectionSystem, ProtectionState } from '../protection/ProtectionSystem';

interface SystemHealth {
  overallHealth: number;
  flowProtection: number;
  codeQuality: number;
  deliverableProgress: number;
  extendedSessionMetrics: {
    focusEndurance: number;
    recoveryEfficiency: number;
    adaptationRate: number;
  };
}

export class SystemHealthIntegrator {
  private readonly FLOW_WEIGHT = 0.35;
  private readonly QUALITY_WEIGHT = 0.35;
  private readonly PROGRESS_WEIGHT = 0.3;
  
  constructor(
    private devOptimizer: DevOptimizer,
    private protectionSystem: ProtectionSystem
  ) {}

  /**
   * Observes integrated system health metrics
   */
  public observeHealth(): Observable<SystemHealth> {
    return combineLatest([
      this.devOptimizer.observeMetrics(),
      this.protectionSystem.getState()
    ]).pipe(
      map(([devMetrics, protectionState]) => this.calculateHealth(devMetrics, protectionState))
    );
  }

  /**
   * Handles extended session protection
   */
  public protectExtendedSession(sessionDuration: number): void {
    // Every 45 minutes in milliseconds
    const checkInterval = 45 * 60 * 1000;
    
    if (sessionDuration % checkInterval < 5 * 60 * 1000) { // Within 5 min window
      const fatigue = Math.min(1, sessionDuration / (12 * 60 * 60 * 1000)); // Max 12 hours
      this.protectionSystem.handleBreach(fatigue * 0.2, 'extended_session');
      
      if (fatigue > 0.7) {
        this.protectionSystem.initiateRecovery();
      }
    }
  }

  /**
   * Optimizes system for ADHD flow states
   */
  public optimizeForADHD(metrics: SystemHealth): void {
    if (metrics.flowProtection > 0.8) {
      // In strong flow state - maximize protection
      this.protectionSystem.reinforce(0.2);
    } else if (metrics.flowProtection < 0.4) {
      // Flow state at risk - initiate recovery
      this.protectionSystem.initiateRecovery();
    }

    // Adapt protection based on focus endurance
    this.protectionSystem.adapt({
      id: 'adhd_optimization',
      protection: {
        shields: metrics.extendedSessionMetrics.focusEndurance,
        resilience: metrics.extendedSessionMetrics.recoveryEfficiency,
        recovery: metrics.extendedSessionMetrics.adaptationRate,
        adaptability: 0.8
      }
    });
  }

  private calculateHealth(
    devMetrics: any, // DevMetrics from DevOptimizer
    protectionState: ProtectionState
  ): SystemHealth {
    const flowProtection = this.calculateFlowProtection(devMetrics, protectionState);
    const codeQuality = this.calculateCodeQuality(devMetrics);
    const deliverableProgress = devMetrics.deliverableProgress;

    const overallHealth = 
      flowProtection * this.FLOW_WEIGHT +
      codeQuality * this.QUALITY_WEIGHT +
      deliverableProgress * this.PROGRESS_WEIGHT;

    return {
      overallHealth,
      flowProtection,
      codeQuality,
      deliverableProgress,
      extendedSessionMetrics: {
        focusEndurance: this.calculateFocusEndurance(devMetrics),
        recoveryEfficiency: protectionState.recovery,
        adaptationRate: protectionState.adaptability
      }
    };
  }

  private calculateFlowProtection(devMetrics: any, protectionState: ProtectionState): number {
    const flowMetric = Math.max(0, 1 - (devMetrics.flowInterruptions / 10));
    return (flowMetric + protectionState.shields) / 2;
  }

  private calculateCodeQuality(devMetrics: any): number {
    return (
      devMetrics.buildHealth * 0.4 +
      devMetrics.testCoverage * 0.3 +
      devMetrics.repoCoherence * 0.3
    );
  }

  private calculateFocusEndurance(devMetrics: any): number {
    const maxFocusTime = 3 * 60 * 60 * 1000; // 3 hours
    return Math.min(1, devMetrics.activeFlowTime / maxFocusTime);
  }
} 