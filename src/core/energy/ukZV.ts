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
    if (this.state$.value.flowLevel === 'high') {
      this.state$.next({
        ...this.state$.value,
        isProtected: true
      });
      
      // Auto-release protection after flow state naturally declines
      setTimeout(() => {
        if (this.state$.value.flowLevel !== 'high') {
          this.releaseFlow();
        }
      }, 30 * 60 * 1000); // 30 minutes
    }
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

  // Enhanced Pattern Evolution with Entropy Protection
  evolvePattern(id: string): void {
    if (!this.state$.value.isProtected) {
      const patterns = this.state$.value.activePatterns;
      const patternIndex = patterns.findIndex(p => p.id === id);
      
      if (patternIndex >= 0) {
        const pattern = patterns[patternIndex];
        const entropyFactor = this.calculateEntropyFactor(pattern);
        
        const evolved = {
          ...pattern,
          strength: Math.min(10, pattern.strength + (1 - entropyFactor)),
          evolution: {
            ...pattern.evolution,
            stage: Math.min(4, pattern.evolution.stage + (entropyFactor < 0.3 ? 1 : 0)),
            lastEvolved: new Date().toISOString(),
            entropyLevel: entropyFactor
          }
        };

        patterns[patternIndex] = evolved;
        
        this.state$.next({
          ...this.state$.value,
          activePatterns: patterns
        });
      }
    }
  }

  private calculateEntropyFactor(pattern: Pattern): number {
    const now = new Date();
    const lastEvolved = new Date(pattern.evolution.lastEvolved);
    const hoursSinceEvolution = (now.getTime() - lastEvolved.getTime()) / (1000 * 60 * 60);
    
    // Entropy increases with time and decreases with pattern strength
    const timeFactor = Math.min(1, hoursSinceEvolution / 24);
    const strengthFactor = 1 - (pattern.strength / 10);
    
    return (timeFactor * 0.7 + strengthFactor * 0.3);
  }

  // Pattern Strength Management
  strengthenPattern(id: string): void {
    const patterns = this.state$.value.activePatterns;
    const patternIndex = patterns.findIndex(p => p.id === id);
    
    if (patternIndex >= 0) {
      const pattern = patterns[patternIndex];
      const entropyFactor = this.calculateEntropyFactor(pattern);
      
      patterns[patternIndex] = {
        ...pattern,
        strength: Math.min(10, pattern.strength + (1 - entropyFactor) * 0.5)
      };
      
      this.state$.next({
        ...this.state$.value,
        activePatterns: patterns
      });
    }
  }

  // Flow State Analytics
  getFlowAnalytics(): Observable<{
    averageFlowDuration: number;
    peakFlowFrequency: number;
    entropyTrend: number;
  }> {
    return this.state$.pipe(
      map(state => {
        const patterns = state.activePatterns;
        const avgEntropy = patterns.reduce((sum, p) => 
          sum + this.calculateEntropyFactor(p), 0) / (patterns.length || 1);
        
        return {
          averageFlowDuration: this.calculateAverageFlowDuration(),
          peakFlowFrequency: this.calculatePeakFlowFrequency(),
          entropyTrend: avgEntropy
        };
      })
    );
  }

  private calculateAverageFlowDuration(): number {
    const flowHistory = this.state$.value.activePatterns.reduce((acc, pattern) => {
      const lastEvolved = new Date(pattern.evolution.lastEvolved);
      const now = new Date();
      const duration = (now.getTime() - lastEvolved.getTime()) / (1000 * 60); // minutes
      return acc + duration;
    }, 0);

    return flowHistory / Math.max(1, this.state$.value.activePatterns.length);
  }

  private calculatePeakFlowFrequency(): number {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const peakFlows = this.state$.value.activePatterns.filter(pattern => {
      const lastEvolved = new Date(pattern.evolution.lastEvolved);
      return lastEvolved > oneDayAgo && pattern.strength >= 8;
    });

    return peakFlows.length;
  }
} 