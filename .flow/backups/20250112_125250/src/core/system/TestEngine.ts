import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PatternEngine, Pattern } from './PatternEngine';

export interface TestMetrics {
  coverage: number;
  reliability: number;
  evolution: number;
  confidence: number;
}

export interface TestState {
  patterns: Pattern[];
  tests: string[];
  metrics: TestMetrics;
  timestamp: number;
}

export class TestEngine {
  private state: BehaviorSubject<TestState>;
  private patternEngine: PatternEngine;

  constructor(patternEngine: PatternEngine) {
    this.patternEngine = patternEngine;
    
    this.state = new BehaviorSubject<TestState>({
      patterns: [],
      tests: [],
      metrics: {
        coverage: 1,
        reliability: 1,
        evolution: 1,
        confidence: 1
      },
      timestamp: Date.now()
    });
  }

  public async observePatterns(): Promise<void> {
    // Subscribe to pattern changes
    this.patternEngine.observeContext().subscribe(async context => {
      const current = this.state.value;
      
      // Update patterns and generate new tests if needed
      if (this.patternsChanged(context.patterns, current.patterns)) {
        const tests = await this.generateTestsForPatterns(context.patterns);
        
        this.state.next({
          ...current,
          patterns: context.patterns,
          tests: [...current.tests, ...tests],
          timestamp: Date.now()
        });
      }
    });
  }

  public async generateTests(): Promise<string[]> {
    const current = this.state.value;
    const tests: string[] = [];
    
    // Generate tests for each pattern
    for (const pattern of current.patterns) {
      const patternTests = await this.generateTestsForPattern(pattern);
      tests.push(...patternTests);
    }
    
    // Update state with new tests
    this.state.next({
      ...current,
      tests: [...current.tests, ...tests],
      metrics: {
        ...current.metrics,
        evolution: Math.min(1, current.metrics.evolution + 0.1)
      },
      timestamp: Date.now()
    });

    return tests;
  }

  public async validateCoverage(): Promise<boolean> {
    const current = this.state.value;
    
    // Calculate coverage metrics
    const coverage = await this.calculateCoverage();
    const reliability = await this.calculateReliability();
    
    // Update metrics if improved
    if (coverage >= current.metrics.coverage && 
        reliability >= current.metrics.reliability) {
      this.state.next({
        ...current,
        metrics: {
          ...current.metrics,
          coverage,
          reliability
        },
        timestamp: Date.now()
      });
      return true;
    }

    return false;
  }

  private async generateTestsForPattern(pattern: Pattern): Promise<string[]> {
    // Generate comprehensive tests for a pattern
    return [
      `test_${pattern.id}_unit`,
      `test_${pattern.id}_integration`,
      `test_${pattern.id}_e2e`
    ];
  }

  private async generateTestsForPatterns(patterns: Pattern[]): Promise<string[]> {
    const tests: string[] = [];
    
    for (const pattern of patterns) {
      const patternTests = await this.generateTestsForPattern(pattern);
      tests.push(...patternTests);
    }
    
    return tests;
  }

  private patternsChanged(newPatterns: Pattern[], oldPatterns: Pattern[]): boolean {
    if (newPatterns.length !== oldPatterns.length) return true;
    
    return newPatterns.some(newPattern => 
      !oldPatterns.find(oldPattern => oldPattern.id === newPattern.id)
    );
  }

  private async calculateCoverage(): Promise<number> {
    const current = this.state.value;
    // Calculate test coverage based on patterns and tests
    return current.tests.length / (current.patterns.length * 3); // 3 tests per pattern
  }

  private async calculateReliability(): Promise<number> {
    const current = this.state.value;
    // Calculate test reliability based on historical success
    return 0.95; // Placeholder
  }

  // Metrics Observation
  public observeMetrics(): Observable<TestMetrics> {
    return this.state.pipe(
      map(state => state.metrics)
    );
  }

  public observeState(): Observable<TestState> {
    return this.state.asObservable();
  }
} 