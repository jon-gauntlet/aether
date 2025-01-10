import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

export interface AutonomicState {
  confidence: number;
  flow_protection: number;
  resonance: number;
  depth: number;
  decisions: {
    success_rate: number;
    resonance: number;
    depth: number;
    protection_level: number;
  }[];
}

export class AutonomicSystem {
  private state$ = new BehaviorSubject<AutonomicState>({
    confidence: 0.8,
    flow_protection: 0.5,
    resonance: 0.7,
    depth: 0.6,
    decisions: []
  });

  private readonly MAX_DECISIONS = 100;
  private readonly CONFIDENCE_DECAY = 0.02;
  private readonly CONFIDENCE_BOOST = 0.05;
  private readonly MIN_CONFIDENCE = 0.4;
  private readonly MAX_CONFIDENCE = 0.95;

  constructor() {
    this.initializeAutonomicSystem();
  }

  private initializeAutonomicSystem() {
    setInterval(() => {
      this.updateAutonomicState();
    }, 5000); // Update every 5 seconds
  }

  private updateAutonomicState() {
    const currentState = this.state$.value;
    const recentDecisions = currentState.decisions.slice(-10);
    
    if (recentDecisions.length === 0) return;

    // Calculate success rate from recent decisions
    const successRate = recentDecisions.reduce(
      (acc, d) => acc + d.success_rate, 0
    ) / recentDecisions.length;

    // Calculate average resonance
    const avgResonance = recentDecisions.reduce(
      (acc, d) => acc + d.resonance, 0
    ) / recentDecisions.length;

    // Calculate average depth
    const avgDepth = recentDecisions.reduce(
      (acc, d) => acc + d.depth, 0
    ) / recentDecisions.length;

    // Update confidence based on performance
    let newConfidence = currentState.confidence;
    if (successRate > 0.7 && avgResonance > 0.6) {
      newConfidence = Math.min(
        this.MAX_CONFIDENCE,
        newConfidence + this.CONFIDENCE_BOOST
      );
    } else {
      newConfidence = Math.max(
        this.MIN_CONFIDENCE,
        newConfidence - this.CONFIDENCE_DECAY
      );
    }

    // Update protection level based on depth and resonance
    const newProtection = Math.min(1, avgDepth * 1.2);

    this.state$.next({
      ...currentState,
      confidence: newConfidence,
      flow_protection: newProtection,
      resonance: avgResonance,
      depth: avgDepth
    });
  }

  public recordDecision(decision: {
    success_rate: number;
    resonance: number;
    depth: number;
    protection_level: number;
  }) {
    const currentState = this.state$.value;
    const newDecisions = [
      ...currentState.decisions,
      decision
    ].slice(-this.MAX_DECISIONS);

    this.state$.next({
      ...currentState,
      decisions: newDecisions
    });
  }

  public observeAutonomicState(): Observable<AutonomicState> {
    return this.state$.pipe(
      distinctUntilChanged()
    );
  }

  public getConfidence(): number {
    return this.state$.value.confidence;
  }

  public getProtectionLevel(): number {
    return this.state$.value.flow_protection;
  }

  public getResonance(): number {
    return this.state$.value.resonance;
  }

  public getDepth(): number {
    return this.state$.value.depth;
  }

  public getDecisionHistory(): Observable<{
    success_rate: number[];
    resonance: number[];
    depth: number[];
    protection_level: number[];
  }> {
    return this.state$.pipe(
      map(state => {
        const decisions = state.decisions;
        return {
          success_rate: decisions.map(d => d.success_rate),
          resonance: decisions.map(d => d.resonance),
          depth: decisions.map(d => d.depth),
          protection_level: decisions.map(d => d.protection_level)
        };
      })
    );
  }

  public async validateAutonomicState(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const state = this.state$.value;
    const issues: string[] = [];

    // Validate confidence
    if (state.confidence < this.MIN_CONFIDENCE) {
      issues.push('Confidence below minimum threshold');
    }

    // Validate protection
    if (state.depth > 0.8 && state.flow_protection < 0.7) {
      issues.push('Insufficient protection for current depth');
    }

    // Validate resonance
    if (state.resonance < 0.5) {
      issues.push('Low system resonance');
    }

    // Validate decision history
    if (state.decisions.length === 0) {
      issues.push('No decision history available');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
} 