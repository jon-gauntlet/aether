import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

export interface EnergyState {
  level: number;          // Current energy level
  type: 'deep' | 'flow' | 'reflective' | 'regenerative';
  context: string[];      // Active contexts
  protection: number;     // Protection level
  resonance: number;      // System resonance
}

export interface EnergyPattern {
  id: string;
  signature: string[];   // Energy signatures
  state: EnergyState;
  evolution: {
    created: number;
    modified: number;
    strength: number;
  };
}

export class EnergySystem {
  private state$ = new BehaviorSubject<EnergyState>({
    level: 1,
    type: 'flow',
    context: [],
    protection: 1,
    resonance: 1
  });

  private patterns$ = new BehaviorSubject<EnergyPattern[]>([]);

  constructor() {
    // Initialize continuous validation
    this.initializeValidation();
  }

  private initializeValidation() {
    // AI-driven pattern validation
    this.state$.pipe(
      distinctUntilChanged((prev, curr) => 
        prev.level === curr.level && 
        prev.resonance === curr.resonance
      )
    ).subscribe(state => {
      this.validateStateTransition(state);
      this.evolvePatterns(state);
      this.protectHighEnergy(state);
    });
  }

  private async validateStateTransition(state: EnergyState) {
    const patterns = this.patterns$.value;
    const matchingPatterns = this.findMatchingPatterns(state, patterns);
    
    if (matchingPatterns.length > 0) {
      // Natural pattern evolution
      await this.strengthenPatterns(matchingPatterns);
    } else {
      // New pattern emergence
      await this.emergeNewPattern(state);
    }
  }

  private findMatchingPatterns(state: EnergyState, patterns: EnergyPattern[]): EnergyPattern[] {
    return patterns.filter(pattern => {
      const energyMatch = Math.abs(pattern.state.level - state.level) < 0.2;
      const contextMatch = state.context.some(ctx => pattern.signature.includes(ctx));
      return energyMatch && contextMatch;
    });
  }

  private async strengthenPatterns(patterns: EnergyPattern[]) {
    const evolved = patterns.map(pattern => ({
      ...pattern,
      evolution: {
        ...pattern.evolution,
        modified: Date.now(),
        strength: pattern.evolution.strength + 0.1
      }
    }));

    this.patterns$.next([
      ...this.patterns$.value.filter(p => !patterns.includes(p)),
      ...evolved
    ]);
  }

  private async emergeNewPattern(state: EnergyState) {
    const newPattern: EnergyPattern = {
      id: `pattern-${Date.now()}`,
      signature: [...state.context],
      state: { ...state },
      evolution: {
        created: Date.now(),
        modified: Date.now(),
        strength: 1
      }
    };

    this.patterns$.next([...this.patterns$.value, newPattern]);
  }

  private async protectHighEnergy(state: EnergyState) {
    if (state.level > 0.8 || state.resonance > 0.8) {
      this.state$.next({
        ...state,
        protection: Math.min(state.protection + 0.1, 1)
      });
    }
  }

  private async evolvePatterns(state: EnergyState) {
    const patterns = this.patterns$.value;
    const timestamp = Date.now();

    // Natural pattern evolution
    patterns.forEach(pattern => {
      const age = timestamp - pattern.evolution.created;
      const recentActivity = timestamp - pattern.evolution.modified < 3600000; // 1 hour

      if (recentActivity && pattern.evolution.strength > 0.7) {
        this.strengthenContext(pattern.signature);
      }
    });
  }

  private async strengthenContext(signature: string[]) {
    const currentState = this.state$.value;
    const newContext = Array.from(new Set([...currentState.context, ...signature]));

    this.state$.next({
      ...currentState,
      context: newContext,
      resonance: Math.min(currentState.resonance + 0.05, 1)
    });
  }

  // Public API
  public observeEnergy(): Observable<EnergyState> {
    return this.state$.asObservable();
  }

  public observePatterns(): Observable<EnergyPattern[]> {
    return this.patterns$.asObservable();
  }

  public async elevateEnergy(context: string[] = []) {
    const current = this.state$.value;
    
    this.state$.next({
      ...current,
      level: Math.min(current.level + 0.1, 1),
      context: Array.from(new Set([...current.context, ...context]))
    });
  }

  public async enterFlow(context: string[] = []) {
    const current = this.state$.value;
    
    this.state$.next({
      ...current,
      type: 'flow',
      level: Math.min(current.level + 0.2, 1),
      context: Array.from(new Set([...current.context, ...context])),
      resonance: Math.min(current.resonance + 0.1, 1)
    });
  }

  public getHighestResonance(): Observable<string[]> {
    return this.patterns$.pipe(
      map(patterns => {
        const strongest = patterns
          .sort((a, b) => b.evolution.strength - a.evolution.strength)
          .slice(0, 3);
        
        return Array.from(new Set(
          strongest.flatMap(p => p.signature)
        ));
      })
    );
  }
} 