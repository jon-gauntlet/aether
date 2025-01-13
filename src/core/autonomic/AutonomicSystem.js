import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import {
  AutonomicState,
  FlowState,
  Protection,
  NaturalPattern,
  DevelopmentPhase,
  EnhancedEnergyState
} from '../types/base';

export class AutonomicSystem {
  private state$ = new BehaviorSubject<AutonomicState | null>(null);
  private readonly RENEWAL_CYCLE = 3000;      // Natural renewal
  private readonly HARMONY_CYCLE = 8000;      // Natural harmony
  private readonly naturalRhythm = 1.618033988749895; // Golden ratio

  constructor() {
    this.initializeNaturalSystem();
  }

  private initializeNaturalSystem() {
    this.state$.next({
      id: crypto.randomUUID(),
      type: 'natural',
      metrics: {
        velocity: 0.8,
        focus: 0.9,
        energy: 1,
        intensity: 0.8,
        coherence: 1,
        resonance: this.naturalRhythm,
        presence: 1,
        harmony: 1,
        rhythm: 1,
        depth: 0.8,
        clarity: 1,
        stability: 1,
        quality: 1
      },
      protection: {
        level: 1,
        type: 'natural',
        strength: 1
      },
      patterns: [],
      timestamp: Date.now()
    });

    setInterval(() => this.maintainEnergyBalance(), this.RENEWAL_CYCLE);
    setInterval(() => this.enableNaturalProtection(), this.HARMONY_CYCLE);
  }

  private maintainEnergyBalance() {
    const currentState = this.state$.value;
    if (!currentState) return;

    const updatedState: AutonomicState = {
      ...currentState,
      metrics: {
        ...currentState.metrics,
        energy: Math.min(currentState.metrics.energy * this.naturalRhythm, 1),
        stability: Math.min(currentState.metrics.stability * this.naturalRhythm, 1)
      },
      timestamp: Date.now()
    };

    this.state$.next(updatedState);
  }

  private enableNaturalProtection() {
    const currentState = this.state$.value;
    if (!currentState) return;

    const updatedState: AutonomicState = {
      ...currentState,
      protection: {
        ...currentState.protection,
        strength: Math.min(currentState.protection.strength * this.naturalRhythm, 1)
      },
      timestamp: Date.now()
    };

    this.state$.next(updatedState);
  }

  public evolvePattern(pattern: NaturalPattern) {
    const currentState = this.state$.value;
    if (!currentState) return;

    const updatedState: AutonomicState = {
      ...currentState,
      patterns: [...currentState.patterns, pattern],
      metrics: {
        ...currentState.metrics,
        coherence: Math.min(currentState.metrics.coherence * this.naturalRhythm, 1),
        resonance: currentState.metrics.resonance * this.naturalRhythm
      },
      timestamp: Date.now()
    };

    this.state$.next(updatedState);
  }

  public observeAutonomicState(): Observable<AutonomicState | null> {
    return this.state$.pipe(distinctUntilChanged());
  }

  public shouldActAutonomously(context: string[]): boolean {
    const currentState = this.state$.value;
    if (!currentState) return false;

    return currentState.metrics.stability > 0.8 && 
           currentState.protection.strength > 0.7;
  }

  public getConfidence(context: string[]): number {
    const currentState = this.state$.value;
    if (!currentState) return 0;

    return currentState.metrics.stability * currentState.protection.strength;
  }

  public getRecommendedAction(context: string[]): string[] {
    const currentState = this.state$.value;
    if (!currentState) return [];

    // Return context enhanced with current state patterns
    return [
      ...context,
      ...currentState.patterns.map(p => p.type)
    ];
  }

  public recordDecision(context: string[], success: boolean, confidence: number) {
    const currentState = this.state$.value;
    if (!currentState) return;

    const updatedState: AutonomicState = {
      ...currentState,
      metrics: {
        ...currentState.metrics,
        stability: Math.min(
          success ? 
            currentState.metrics.stability + (confidence * 0.1) :
            currentState.metrics.stability - (confidence * 0.1),
          1
        )
      },
      timestamp: Date.now()
    };

    this.state$.next(updatedState);
  }
} 