import { Pattern, PatternState, isPattern } from './types';

export class PatternSystem {
  private patterns: Map<string, Pattern>;

  constructor() {
    this.patterns = new Map();
  }

  public addPattern(pattern: Pattern): void {
    if (!isPattern(pattern)) {
      throw new Error('Invalid pattern structure');
    }
    this.patterns.set(pattern.id, pattern);
  }

  public getPattern(id: string): Pattern | undefined {
    return this.patterns.get(id);
  }

  public updatePatternState(id: string, state: PatternState): void {
    const pattern = this.patterns.get(id);
    if (!pattern) {
      throw new Error('Pattern not found');
    }

    this.patterns.set(id, {
      ...pattern,
      state
    });
  }

  public updatePatternEnergy(id: string, current: number): void {
    const pattern = this.patterns.get(id);
    if (!pattern) {
      throw new Error('Pattern not found');
    }

    this.patterns.set(id, {
      ...pattern,
      energy: {
        ...pattern.energy,
        current
      }
    });
  }

  public getActivePatterns(): Pattern[] {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.state.active);
  }
} 