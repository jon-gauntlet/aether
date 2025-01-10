import { BehaviorSubject } from 'rxjs';
import { Pattern, PatternManager as IPatternManager, PatternLibrary } from '../types/autonomic';

export class PatternManager implements IPatternManager {
  private current$ = new BehaviorSubject<Pattern | null>(null);
  private history$ = new BehaviorSubject<Pattern[]>([]);

  constructor(public library: PatternLibrary) {}

  get current(): Pattern | null {
    return this.current$.value;
  }

  get history(): Pattern[] {
    return this.history$.value;
  }

  setCurrent(pattern: Pattern | null): void {
    this.current$.next(pattern);
    if (pattern) {
      this.addToHistory(pattern);
    }
  }

  addToHistory(pattern: Pattern): void {
    const history = this.history$.value;
    if (!history.find(p => p.id === pattern.id)) {
      this.history$.next([...history, pattern]);
    }
  }

  clearHistory(): void {
    this.history$.next([]);
  }

  findSimilar(pattern: Pattern): Pattern[] {
    const similarPatterns = this.library.findPatterns({
      type: pattern.type,
      flow: pattern.flow,
      context: pattern.context
    });

    return similarPatterns
      .filter(p => p.id !== pattern.id)
      .sort((a, b) => {
        const aScore = this.calculateSimilarityScore(pattern, a);
        const bScore = this.calculateSimilarityScore(pattern, b);
        return bScore - aScore;
      });
  }

  suggestNext(current: Pattern): Pattern[] {
    const history = this.history$.value;
    const suggestions = this.library.patterns
      .filter(p => !history.find(h => h.id === p.id))
      .map(pattern => ({
        pattern,
        score: this.calculateSuggestionScore(current, pattern, history)
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ pattern }) => pattern);

    return suggestions.slice(0, 5);
  }

  subscribe(callback: (state: { current: Pattern | null; history: Pattern[] }) => void) {
    return this.current$.subscribe(current => {
      callback({ current, history: this.history$.value });
    });
  }

  // Pattern Analysis Methods
  private calculateSimilarityScore(pattern1: Pattern, pattern2: Pattern): number {
    let score = 0;

    // Type match
    if (pattern1.type === pattern2.type) score += 0.3;

    // Flow match
    if (pattern1.flow === pattern2.flow) score += 0.2;

    // Energy similarity
    score += (1 - Math.abs(pattern1.energy - pattern2.energy)) * 0.2;

    // Protection similarity
    score += (1 - Math.abs(pattern1.protection - pattern2.protection)) * 0.1;

    // Context overlap
    const contextOverlap =
      pattern1.context.filter(c => pattern2.context.includes(c)).length /
      Math.max(pattern1.context.length, pattern2.context.length);
    score += contextOverlap * 0.1;

    // States overlap
    const statesOverlap =
      pattern1.states.filter(s => pattern2.states.includes(s)).length /
      Math.max(pattern1.states.length, pattern2.states.length);
    score += statesOverlap * 0.1;

    return score;
  }

  private calculateSuggestionScore(
    current: Pattern,
    suggestion: Pattern,
    history: Pattern[]
  ): number {
    let score = 0;

    // Base similarity score
    score += this.calculateSimilarityScore(current, suggestion) * 0.4;

    // Success rate
    const successRate = suggestion.metadata.success / suggestion.metadata.uses;
    score += successRate * 0.3;

    // Energy alignment
    const energyDiff = Math.abs(current.energy - suggestion.energy);
    score += (1 - energyDiff) * 0.1;

    // Flow compatibility
    if (suggestion.flow === current.flow) {
      score += 0.1;
    } else if (
      (current.flow === 'natural' && suggestion.flow === 'guided') ||
      (current.flow === 'guided' && suggestion.flow === 'protected')
    ) {
      score += 0.05;
    }

    // Context continuity
    const contextContinuity =
      current.context.filter(c => suggestion.context.includes(c)).length /
      current.context.length;
    score += contextContinuity * 0.1;

    // Historical success
    const historicalSuccess = this.calculateHistoricalSuccess(suggestion, history);
    score += historicalSuccess * 0.1;

    return score;
  }

  private calculateHistoricalSuccess(
    pattern: Pattern,
    history: Pattern[]
  ): number {
    const similarPatterns = history.filter(
      h => this.calculateSimilarityScore(pattern, h) > 0.7
    );

    if (similarPatterns.length === 0) return 0.5;

    const successRates = similarPatterns.map(
      p => p.metadata.success / p.metadata.uses
    );
    return (
      successRates.reduce((a, b) => a + b, 0) / successRates.length
    );
  }

  // Pattern Evolution Methods
  evolveCurrentPattern(): void {
    const current = this.current$.value;
    if (current) {
      this.library.evolvePattern(current.id);
      const evolved = this.library.getPattern(current.id);
      if (evolved) {
        this.setCurrent(evolved);
      }
    }
  }

  // Pattern Protection Methods
  protectCurrentPattern(): void {
    const current = this.current$.value;
    if (current) {
      this.library.crystallizePattern(current.id);
      const protected_ = this.library.getPattern(current.id);
      if (protected_) {
        this.setCurrent(protected_);
      }
    }
  }

  // Pattern Transition Methods
  transitionTo(pattern: Pattern): void {
    const current = this.current$.value;
    if (current) {
      // Record transition in history
      this.addToHistory(current);
      
      // Update success metrics
      this.library.trackPatternUse(current.id, true);
      
      // Evolve current pattern
      this.library.evolvePattern(current.id);
    }

    // Set new current pattern
    this.setCurrent(pattern);
  }
} 