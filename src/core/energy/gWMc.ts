import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { FlowState, FlowLevel } from '../types/flow';
import { Pattern } from '../types/patterns';

interface EnergyState {
  flowState: FlowState;
  flowLevel: FlowLevel;
  isProtected: boolean;
  activePatterns: Pattern[];
}

export class EnergySystem {
  private state$ = new BehaviorSubject<EnergyState>({
    flowState: 'rest',
    flowLevel: 'medium',
    isProtected: false,
    activePatterns: []
  });

  // Flow State Management
  getFlowState(): Observable<FlowState> {
    return this.state$.pipe(map(state => state.flowState));
  }

  setFlowState(state: FlowState): void {
    if (!this.state$.value.isProtected) {
      this.state$.next({
        ...this.state$.value,
        flowState: state
      });
    }
  }

  // Flow Level Management
  getFlowLevel(): Observable<FlowLevel> {
    return this.state$.pipe(map(state => state.flowLevel));
  }

  setFlowLevel(level: FlowLevel): void {
    if (!this.state$.value.isProtected) {
      this.state$.next({
        ...this.state$.value,
        flowLevel: level
      });
    }
  }

  // Flow Protection
  protectFlow(): void {
    this.state$.next({
      ...this.state$.value,
      isProtected: true
    });
  }

  releaseFlow(): void {
    this.state$.next({
      ...this.state$.value,
      isProtected: false
    });
  }

  // Pattern Management
  getActivePatterns(): Observable<Pattern[]> {
    return this.state$.pipe(map(state => state.activePatterns));
  }

  addPattern(pattern: Omit<Pattern, 'id'>): void {
    const newPattern: Pattern = {
      ...pattern,
      id: uuidv4()
    };

    this.state$.next({
      ...this.state$.value,
      activePatterns: [...this.state$.value.activePatterns, newPattern]
    });
  }

  removePattern(id: string): void {
    this.state$.next({
      ...this.state$.value,
      activePatterns: this.state$.value.activePatterns.filter(p => p.id !== id)
    });
  }

  evolvePattern(id: string): void {
    this.state$.next({
      ...this.state$.value,
      activePatterns: this.state$.value.activePatterns.map(pattern => {
        if (pattern.id === id) {
          return {
            ...pattern,
            strength: pattern.strength + 1,
            evolution: {
              stage: pattern.evolution.stage + 1,
              history: [...pattern.evolution.history, `Evolved at ${new Date().toISOString()}`]
            }
          };
        }
        return pattern;
      })
    });
  }
} 