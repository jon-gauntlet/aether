import { BehaviorSubject, Observable } from 'rxjs';
import { Pattern, PatternState } from '../../types/patterns';

interface PatternStats {
  uses: number;
  success: number;
  lastUsed: number;
}

interface StoredPattern extends Pattern {
  stats: PatternStats;
}

export class PersistentPatternManager {
  private static STORAGE_KEY = 'aether_patterns';
  private patterns$ = new BehaviorSubject<StoredPattern[]>([]);

  constructor() {
    this.loadPatterns();
  }

  private loadPatterns() {
    try {
      const stored = localStorage.getItem(PersistentPatternManager.STORAGE_KEY);
      if (stored) {
        const patterns = JSON.parse(stored);
        if (Array.isArray(patterns)) {
          this.patterns$.next(patterns);
        }
      }
    } catch (error) {
      console.error('Failed to load patterns:', error);
      this.patterns$.next([]);
    }
  }

  private savePatterns() {
    try {
      localStorage.setItem(
        PersistentPatternManager.STORAGE_KEY,
        JSON.stringify(this.patterns$.value)
      );
    } catch (error) {
      console.error('Failed to save patterns:', error);
    }
  }

  getPatterns(): Observable<StoredPattern[]> {
    return this.patterns$.asObservable();
  }

  addPattern(pattern: Pattern): void {
    const storedPattern: StoredPattern = {
      ...pattern,
      stats: {
        uses: 0,
        success: 0,
        lastUsed: Date.now()
      }
    };

    const patterns = [...this.patterns$.value, storedPattern];
    this.patterns$.next(patterns);
    this.savePatterns();
  }

  updatePattern(pattern: StoredPattern): void {
    const patterns = this.patterns$.value.map(p =>
      p.id === pattern.id ? pattern : p
    );
    this.patterns$.next(patterns);
    this.savePatterns();
  }

  recordUse(patternId: string, success: boolean): void {
    const patterns = this.patterns$.value.map(pattern => {
      if (pattern.id !== patternId) return pattern;

      const stats = {
        uses: pattern.stats.uses + 1,
        success: pattern.stats.success + (success ? 1 : 0),
        lastUsed: Date.now()
      };

      return {
        ...pattern,
        stats,
        successRate: stats.success / stats.uses,
        states: this.determineStates(pattern.energyLevel, stats.success / stats.uses)
      };
    });

    this.patterns$.next(patterns);
    this.savePatterns();
  }

  importPatterns(patterns: Pattern[]): void {
    const storedPatterns = patterns.map(pattern => ({
      ...pattern,
      stats: {
        uses: 0,
        success: 0,
        lastUsed: Date.now()
      }
    }));

    this.patterns$.next(storedPatterns);
    this.savePatterns();
  }

  exportPatterns(): Pattern[] {
    return this.patterns$.value.map(({ stats, ...pattern }) => pattern);
  }

  clearPatterns(): void {
    this.patterns$.next([]);
    this.savePatterns();
  }

  private determineStates(energyLevel: number, successRate: number): PatternState[] {
    const states: PatternState[] = [PatternState.ACTIVE];

    if (successRate > 0.8) {
      states.push(PatternState.STABLE);
    }

    if (energyLevel > 0.7) {
      states.push(PatternState.EVOLVING);
    }

    if (successRate > 0.9 && energyLevel > 0.8) {
      states.push(PatternState.PROTECTED);
    }

    return states;
  }
} 