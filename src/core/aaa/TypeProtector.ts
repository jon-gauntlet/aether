import { Observable, Subject } from 'rxjs';
import type { DevMetrics, DevAction } from './DevOptimizer';

interface TypeMetrics {
  // Type Safety Metrics
  typeCoherence: number;      // 0-1 type system consistency
  validationCoverage: number; // 0-1 runtime validation coverage
  boundaryIntegrity: number;  // 0-1 type boundary protection
  nullSafety: number;         // 0-1 null/undefined handling
  streamTypeSafety: number;   // 0-1 reactive stream type safety
  
  // System Health
  typeErrors: number;         // Count of type errors
  validationErrors: number;   // Count of runtime validation failures
  recoverySuccess: number;    // 0-1 error recovery rate
}

interface TypeAction {
  type: 'VALIDATE' | 'GUARD' | 'PROTECT' | 'RECOVER';
  target: string;
  success: boolean;
  timestamp: number;
  metadata?: {
    errorType?: string;
    recovery?: string;
    impact?: number;
  };
}

/**
 * Protects type safety using AAA principles:
 * - AI-First: Learn and adapt type patterns
 * - Autonomic: Self-heal and optimize
 * - Agile: Rapid validation and recovery
 */
export class TypeProtector {
  private metrics: TypeMetrics = {
    typeCoherence: 1,
    validationCoverage: 1,
    boundaryIntegrity: 1,
    nullSafety: 1,
    streamTypeSafety: 1,
    typeErrors: 0,
    validationErrors: 0,
    recoverySuccess: 1
  };

  private actions: TypeAction[] = [];
  private metricsSubject = new Subject<TypeMetrics>();

  /**
   * Records a type system action and updates metrics
   */
  recordAction(action: TypeAction) {
    this.actions.push(action);
    this.optimizeFromAction(action);
    this.metricsSubject.next(this.metrics);
  }

  /**
   * Gets current type system recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.typeCoherence < 0.9) {
      recommendations.push('Review type definitions for consistency');
    }
    if (this.metrics.validationCoverage < 0.8) {
      recommendations.push('Add runtime type validation');
    }
    if (this.metrics.boundaryIntegrity < 0.9) {
      recommendations.push('Strengthen type boundaries');
    }
    if (this.metrics.nullSafety < 0.9) {
      recommendations.push('Improve null safety handling');
    }
    if (this.metrics.streamTypeSafety < 0.9) {
      recommendations.push('Enhance stream type safety');
    }

    return recommendations;
  }

  /**
   * Gets type system metrics
   */
  getMetrics(): TypeMetrics {
    return { ...this.metrics };
  }

  /**
   * Observes type system metrics
   */
  observeMetrics(): Observable<TypeMetrics> {
    return this.metricsSubject.asObservable();
  }

  /**
   * Updates DevOptimizer metrics based on type system health
   */
  updateDevMetrics(devMetrics: DevMetrics): DevMetrics {
    const typeHealth = this.calculateTypeSystemHealth();
    
    return {
      ...devMetrics,
      buildHealth: Math.min(devMetrics.buildHealth, typeHealth),
      repoCoherence: (devMetrics.repoCoherence + this.metrics.typeCoherence) / 2
    };
  }

  /**
   * Creates a type-safe action for DevOptimizer
   */
  createDevAction(action: TypeAction): DevAction {
    return {
      type: 'BUILD',
      timestamp: action.timestamp,
      metadata: {
        success: action.success,
        typeHealth: this.calculateTypeSystemHealth(),
        ...action.metadata
      }
    };
  }

  private optimizeFromAction(action: TypeAction): void {
    const impact = action.metadata?.impact ?? 0.1;
    
    switch (action.type) {
      case 'VALIDATE':
        if (action.success) {
          this.metrics.validationCoverage = Math.min(1, this.metrics.validationCoverage + impact);
        } else {
          this.metrics.validationErrors++;
          this.metrics.validationCoverage = Math.max(0, this.metrics.validationCoverage - impact);
        }
        break;

      case 'GUARD':
        if (action.success) {
          this.metrics.boundaryIntegrity = Math.min(1, this.metrics.boundaryIntegrity + impact);
        } else {
          this.metrics.typeErrors++;
          this.metrics.boundaryIntegrity = Math.max(0, this.metrics.boundaryIntegrity - impact);
        }
        break;

      case 'PROTECT':
        if (action.success) {
          this.metrics.nullSafety = Math.min(1, this.metrics.nullSafety + impact);
          this.metrics.streamTypeSafety = Math.min(1, this.metrics.streamTypeSafety + impact);
        } else {
          this.metrics.typeErrors++;
          this.metrics.nullSafety = Math.max(0, this.metrics.nullSafety - impact);
          this.metrics.streamTypeSafety = Math.max(0, this.metrics.streamTypeSafety - impact);
        }
        break;

      case 'RECOVER':
        if (action.success) {
          this.metrics.recoverySuccess = Math.min(1, this.metrics.recoverySuccess + impact);
        } else {
          this.metrics.recoverySuccess = Math.max(0, this.metrics.recoverySuccess - impact);
        }
        break;
    }

    // Update overall type coherence
    this.metrics.typeCoherence = this.calculateTypeSystemHealth();
  }

  private calculateTypeSystemHealth(): number {
    const weights = {
      validationCoverage: 0.2,
      boundaryIntegrity: 0.2,
      nullSafety: 0.2,
      streamTypeSafety: 0.2,
      recoverySuccess: 0.2
    };

    return (
      this.metrics.validationCoverage * weights.validationCoverage +
      this.metrics.boundaryIntegrity * weights.boundaryIntegrity +
      this.metrics.nullSafety * weights.nullSafety +
      this.metrics.streamTypeSafety * weights.streamTypeSafety +
      this.metrics.recoverySuccess * weights.recoverySuccess
    );
  }
} 