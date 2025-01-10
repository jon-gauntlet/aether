import { BehaviorSubject } from 'rxjs';
import { Pattern, PatternLibrary as IPatternLibrary } from '../types/autonomic';

export class PatternLibrary implements IPatternLibrary {
  private patterns$ = new BehaviorSubject<Pattern[]>([]);

  get patterns(): Pattern[] {
    return this.patterns$.value;
  }

  addPattern(pattern: Pattern): void {
    if (!this.getPattern(pattern.id)) {
      this.patterns$.next([...this.patterns, pattern]);
    }
  }

  removePattern(id: string): void {
    this.patterns$.next(this.patterns.filter(p => p.id !== id));
  }

  updatePattern(id: string, updates: Partial<Pattern>): void {
    const pattern = this.getPattern(id);
    if (pattern) {
      const updatedPattern = {
        ...pattern,
        ...updates,
        metadata: {
          ...pattern.metadata,
          updated: Date.now()
        }
      };
      this.patterns$.next(
        this.patterns.map(p => (p.id === id ? updatedPattern : p))
      );
    }
  }

  getPattern(id: string): Pattern | undefined {
    return this.patterns.find(p => p.id === id);
  }

  findPatterns(query: Partial<Pattern>): Pattern[] {
    return this.patterns.filter(pattern => {
      return Object.entries(query).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.every(v => 
            (pattern as any)[key].includes(v)
          );
        }
        if (typeof value === 'object' && value !== null) {
          return Object.entries(value).every(([k, v]) =>
            (pattern as any)[key][k] === v
          );
        }
        return (pattern as any)[key] === value;
      });
    });
  }

  trackPatternUse(id: string, success: boolean): void {
    const pattern = this.getPattern(id);
    if (pattern) {
      const updatedPattern = {
        ...pattern,
        metadata: {
          ...pattern.metadata,
          uses: pattern.metadata.uses + 1,
          success: pattern.metadata.success + (success ? 1 : 0),
          updated: Date.now()
        }
      };
      this.patterns$.next(
        this.patterns.map(p => (p.id === id ? updatedPattern : p))
      );
    }
  }

  subscribe(callback: (patterns: Pattern[]) => void) {
    return this.patterns$.subscribe(callback);
  }

  // Pattern Analysis Methods
  getMostUsedPatterns(limit = 10): Pattern[] {
    return [...this.patterns]
      .sort((a, b) => b.metadata.uses - a.metadata.uses)
      .slice(0, limit);
  }

  getMostSuccessfulPatterns(limit = 10): Pattern[] {
    return [...this.patterns]
      .sort((a, b) => {
        const aSuccess = a.metadata.success / a.metadata.uses;
        const bSuccess = b.metadata.success / b.metadata.uses;
        return bSuccess - aSuccess;
      })
      .slice(0, limit);
  }

  getPatternsByEnergy(energy: number, tolerance = 0.1): Pattern[] {
    return this.patterns.filter(
      p => Math.abs(p.energy - energy) <= tolerance
    );
  }

  getPatternsByFlow(flow: string): Pattern[] {
    return this.patterns.filter(p => p.flow === flow);
  }

  getPatternsByContext(context: string[]): Pattern[] {
    return this.patterns.filter(p =>
      context.every(c => p.context.includes(c))
    );
  }

  getPatternsByState(states: string[]): Pattern[] {
    return this.patterns.filter(p =>
      states.every(s => p.states.includes(s))
    );
  }

  // Pattern Evolution Methods
  evolvePattern(id: string): void {
    const pattern = this.getPattern(id);
    if (pattern) {
      const successRate = pattern.metadata.success / pattern.metadata.uses;
      const energyTrend = this.calculateTrend(pattern.metadata.energy);
      const protectionTrend = this.calculateTrend(pattern.metadata.protection);

      const updatedPattern = {
        ...pattern,
        energy: this.adjustEnergy(pattern.energy, energyTrend, successRate),
        protection: this.adjustProtection(
          pattern.protection,
          protectionTrend,
          successRate
        ),
        metadata: {
          ...pattern.metadata,
          updated: Date.now()
        }
      };

      this.patterns$.next(
        this.patterns.map(p => (p.id === id ? updatedPattern : p))
      );
    }
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const recent = values.slice(-5);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const last = recent[recent.length - 1];
    return last - avg;
  }

  private adjustEnergy(current: number, trend: number, successRate: number): number {
    const adjustment = trend * successRate;
    return Math.max(0, Math.min(1, current + adjustment));
  }

  private adjustProtection(
    current: number,
    trend: number,
    successRate: number
  ): number {
    const adjustment = trend * successRate;
    return Math.max(0, Math.min(1, current + adjustment));
  }

  // Pattern Crystallization Methods
  crystallizePattern(id: string): void {
    const pattern = this.getPattern(id);
    if (pattern && pattern.metadata.uses >= 10) {
      const successRate = pattern.metadata.success / pattern.metadata.uses;
      if (successRate >= 0.8) {
        const crystalizedPattern = {
          ...pattern,
          protection: Math.max(pattern.protection, 0.8),
          metadata: {
            ...pattern.metadata,
            updated: Date.now()
          }
        };

        this.patterns$.next(
          this.patterns.map(p => (p.id === id ? crystalizedPattern : p))
        );
      }
    }
  }
}