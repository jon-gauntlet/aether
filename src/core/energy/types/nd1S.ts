import { FlowContext, FlowProtection } from '../flow/FlowStateGuardian';
import { EnergyState } from '../../types/base';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { PatternCoherence } from '../patterns/PatternCoherence';
import { v4 as uuidv4 } from 'uuid';

export interface AutonomicState {
  id: string;
  flowContext: string;
  energyState: EnergyState;
  coherenceLevel: number;
  adaptiveCapacity: number;
  recoveryPhase: 'active' | 'resting' | 'transitioning';
  metrics: {
    sustainedFocus: number;
    patternQuality: number;
    energyEfficiency: number;
  };
}

export class AutonomicDevelopment {
  private state$ = new BehaviorSubject<Map<string, AutonomicState>>(new Map());
  private readonly coherence: PatternCoherence;
  
  private readonly QUALITY_THRESHOLD = 0.85;
  private readonly ENERGY_RESERVE = 0.2;
  private readonly FOCUS_DURATION = 45 * 60 * 1000; // 45 minutes
  
  constructor(coherence: PatternCoherence) {
    this.coherence = coherence;
    this.initializeAutonomicCycle();
  }

  private initializeAutonomicCycle() {
    setInterval(() => {
      this.evolveStates();
      this.optimizeResources();
      this.validatePatterns();
    }, 60 * 1000); // Every minute
  }

  private evolveStates() {
    const states = this.state$.value;
    const evolved = new Map(states);

    for (const [id, state] of states) {
      evolved.set(id, {
        ...state,
        adaptiveCapacity: this.calculateAdaptiveCapacity(state),
        metrics: this.updateMetrics(state)
      });
    }

    this.state$.next(evolved);
  }

  private calculateAdaptiveCapacity(state: AutonomicState): number {
    const focusFactor = state.metrics.sustainedFocus / this.FOCUS_DURATION;
    const qualityFactor = state.metrics.patternQuality / this.QUALITY_THRESHOLD;
    const energyFactor = Math.max(0, (state.energyState.current - this.ENERGY_RESERVE) / (1 - this.ENERGY_RESERVE));
    
    return (focusFactor * 0.4 + qualityFactor * 0.4 + energyFactor * 0.2);
  }

  private updateMetrics(state: AutonomicState): AutonomicState['metrics'] {
    return {
      sustainedFocus: this.calculateSustainedFocus(state),
      patternQuality: this.coherence.evaluateQuality(state.flowContext),
      energyEfficiency: state.energyState.efficiency
    };
  }

  private calculateSustainedFocus(state: AutonomicState): number {
    const currentTime = Date.now();
    const focusStart = state.energyState.lastTransition;
    const focusDuration = currentTime - focusStart;
    return Math.min(1, focusDuration / this.FOCUS_DURATION);
  }

  private optimizeResources() {
    const states = this.state$.value;
    for (const state of states.values()) {
      if (state.adaptiveCapacity < 0.6) {
        this.initiateRecovery(state);
      } else if (state.recoveryPhase === 'resting' && state.adaptiveCapacity > 0.8) {
        this.resumeActivity(state);
      }
    }
  }

  private validatePatterns() {
    const states = this.state$.value;
    for (const state of states.values()) {
      if (state.metrics.patternQuality < this.QUALITY_THRESHOLD) {
        this.coherence.repairPatterns(state.flowContext);
      }
    }
  }

  private initiateRecovery(state: AutonomicState) {
    const states = this.state$.value;
    states.set(state.id, {
      ...state,
      recoveryPhase: 'resting',
      metrics: {
        ...state.metrics,
        energyEfficiency: Math.min(1, state.metrics.energyEfficiency * 1.2)
      }
    });
    this.state$.next(states);
  }

  private resumeActivity(state: AutonomicState) {
    const states = this.state$.value;
    states.set(state.id, {
      ...state,
      recoveryPhase: 'active',
      coherenceLevel: Math.min(1, state.coherenceLevel * 1.1)
    });
    this.state$.next(states);
  }

  public createAutonomicState(
    flowContext: string,
    energyState: EnergyState
  ): string {
    const id = uuidv4();
    const state: AutonomicState = {
      id,
      flowContext,
      energyState,
      coherenceLevel: 1,
      adaptiveCapacity: 0.8,
      recoveryPhase: 'active',
      metrics: {
        sustainedFocus: 1,
        patternQuality: 1,
        energyEfficiency: 1
      }
    };

    const states = this.state$.value;
    states.set(id, state);
    this.state$.next(states);
    return id;
  }

  public observeState(id: string): Observable<AutonomicState | undefined> {
    return this.state$.pipe(
      map(states => states.get(id)),
      distinctUntilChanged()
    );
  }
} 