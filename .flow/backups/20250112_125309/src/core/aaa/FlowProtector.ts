import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { TypeProtector } from './TypeProtector';
import type { Prevention } from './TypeProtector';

interface FlowBreak {
  type: 'error' | 'distraction' | 'context-switch';
  timestamp: number;
  duration: number;
  impact: number;
}

interface FlowRecovery {
  type: 'auto' | 'guided' | 'manual';
  success: boolean;
  duration: number;
}

export class FlowProtector extends TypeProtector {
  private flowBreaks: FlowBreak[] = [];
  private recoveries: FlowRecovery[] = [];
  
  /**
   * Predicts and prevents flow breaks before they happen
   */
  async preventFlowBreaks(): Promise<void> {
    const predictions = this.predictIssues();
    
    for (const prediction of predictions) {
      if (prediction.confidence > 0.7) {
        // Auto-fix high confidence issues
        if (prediction.protection.type === 'autofix') {
          await this.autoFix(prediction);
        }
        
        // Warn about potential issues
        if (prediction.protection.type === 'warning') {
          console.warn(`🚨 Flow Protection: ${prediction.protection.action}`);
        }
        
        // Block known flow-breaking actions
        if (prediction.protection.type === 'block') {
          throw new Error(`Flow Protection: ${prediction.protection.action}`);
        }
      }
    }
  }

  /**
   * Tracks flow breaks and their impact
   */
  recordFlowBreak(type: FlowBreak['type'], impact: number) {
    const break_: FlowBreak = {
      type,
      timestamp: Date.now(),
      duration: 0, // Will be updated on recovery
      impact
    };
    
    this.flowBreaks.push(break_);
    this.learnPattern(
      new TypeError(`Flow break: ${type}`),
      `Prevent ${type} breaks`,
      impact
    );
  }

  /**
   * Records flow state recovery attempts
   */
  recordRecovery(type: FlowRecovery['type'], success: boolean) {
    const lastBreak = this.flowBreaks[this.flowBreaks.length - 1];
    
    if (lastBreak) {
      lastBreak.duration = Date.now() - lastBreak.timestamp;
      
      const recovery: FlowRecovery = {
        type,
        success,
        duration: lastBreak.duration
      };
      
      this.recoveries.push(recovery);
      
      // Learn from successful recoveries
      if (success) {
        this.learnPattern(
          new TypeError(`Recovery from: ${lastBreak.type}`),
          `Use ${type} recovery`,
          lastBreak.impact
        );
      }
    }
  }

  /**
   * Gets flow state analytics
   */
  getFlowAnalytics() {
    return {
      breaks: this.flowBreaks.length,
      avgImpact: this.calculateAverageImpact(),
      recoveryRate: this.calculateRecoveryRate(),
      patterns: Array.from(this.patterns.values())
        .filter(p => p.flowImpact > 0.3)
        .sort((a, b) => b.frequency - a.frequency)
    };
  }

  /**
   * Monitors overall system health impact on flow
   */
  observeSystemHealth(): Observable<number> {
    return combineLatest([
      this.observeFlowState(),
      this.observeMetrics()
    ]).pipe(
      map(([flow, metrics]) => {
        const weights = {
          flow: 0.4,
          autoHealing: 0.2,
          patternLearning: 0.2,
          flowProtection: 0.2
        };
        
        return flow * weights.flow +
          metrics.autoHealing * weights.autoHealing +
          metrics.patternLearning * weights.patternLearning +
          metrics.flowProtection * weights.flowProtection;
      })
    );
  }

  private async autoFix(prediction: Prevention): Promise<void> {
    try {
      // Implement safe auto-fix logic here
      console.log(`🛠️ Auto-fixing: ${prediction.protection.action}`);
    } catch (error) {
      console.error('Auto-fix failed:', error);
      throw error;
    }
  }

  private calculateAverageImpact(): number {
    if (this.flowBreaks.length === 0) return 0;
    
    const totalImpact = this.flowBreaks.reduce((sum, break_) => sum + break_.impact, 0);
    return totalImpact / this.flowBreaks.length;
  }

  private calculateRecoveryRate(): number {
    if (this.recoveries.length === 0) return 1;
    
    const successfulRecoveries = this.recoveries.filter(r => r.success).length;
    return successfulRecoveries / this.recoveries.length;
  }
} 