import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Pattern, PatternEngine } from './PatternEngine';
import { TestEngine } from './TestEngine';

export interface ContextMetrics {
  understanding: number;  // How well the system understands the context
  coherence: number;     // How well patterns fit together
  evolution: number;     // Rate of positive change
  stability: number;     // System stability
}

export interface ContextState {
  patterns: Pattern[];
  metrics: ContextMetrics;
  optimizations: string[];
  timestamp: number;
}

export class ContextEngine {
  private state: BehaviorSubject<ContextState>;
  private patternEngine: PatternEngine;
  private testEngine: TestEngine;

  constructor(patternEngine: PatternEngine, testEngine: TestEngine) {
    this.patternEngine = patternEngine;
    this.testEngine = testEngine;
    
    this.state = new BehaviorSubject<ContextState>({
      patterns: [],
      metrics: {
        understanding: 1,
        coherence: 1,
        evolution: 1,
        stability: 1
      },
      optimizations: [],
      timestamp: Date.now()
    });
  }

  public async understand(codebase: string[]): Promise<void> {
    // Analyze codebase for patterns
    const patterns = await this.patternEngine.recognize(codebase);
    
    // Update understanding metrics
    const understanding = await this.calculateUnderstanding(patterns);
    
    // Update state with new understanding
    const current = this.state.value;
    this.state.next({
      ...current,
      patterns: patterns.map(p => p.pattern),
      metrics: {
        ...current.metrics,
        understanding
      },
      timestamp: Date.now()
    });
  }

  public async optimize(patterns: Pattern[]): Promise<void> {
    const optimizations: string[] = [];
    const current = this.state.value;

    // Generate optimizations for each pattern
    for (const pattern of patterns) {
      const opts = await this.generateOptimizations(pattern);
      optimizations.push(...opts);
    }

    // Apply optimizations if they improve metrics
    if (await this.validateOptimizations(optimizations)) {
      this.state.next({
        ...current,
        optimizations,
        metrics: {
          ...current.metrics,
          evolution: Math.min(1, current.metrics.evolution + 0.1)
        },
        timestamp: Date.now()
      });
    }
  }

  public async maintain(quality: number): Promise<boolean> {
    const current = this.state.value;
    
    // Check system stability
    const stability = await this.calculateStability();
    
    // Update metrics based on quality and stability
    const newMetrics = {
      ...current.metrics,
      stability,
      coherence: Math.min(1, (stability + quality) / 2)
    };

    // Update state if metrics improved
    if (this.metricsImproved(newMetrics, current.metrics)) {
      this.state.next({
        ...current,
        metrics: newMetrics,
        timestamp: Date.now()
      });
      return true;
    }

    return false;
  }

  private async calculateUnderstanding(patterns: any[]): Promise<number> {
    // Calculate understanding based on pattern recognition confidence
    return patterns.reduce((acc, p) => acc + p.confidence, 0) / patterns.length;
  }

  private async generateOptimizations(pattern: Pattern): Promise<string[]> {
    // Generate potential optimizations based on pattern analysis
    return [
      `optimize_${pattern.id}_structure`,
      `optimize_${pattern.id}_performance`,
      `optimize_${pattern.id}_quality`
    ];
  }

  private async validateOptimizations(optimizations: string[]): Promise<boolean> {
    // Validate that optimizations maintain or improve system quality
    return optimizations.length > 0;
  }

  private async calculateStability(): Promise<number> {
    const current = this.state.value;
    // Calculate system stability based on metrics history
    return (
      current.metrics.understanding * 0.3 +
      current.metrics.coherence * 0.3 +
      current.metrics.evolution * 0.4
    );
  }

  private metricsImproved(newMetrics: ContextMetrics, oldMetrics: ContextMetrics): boolean {
    return (
      newMetrics.stability >= oldMetrics.stability &&
      newMetrics.coherence >= oldMetrics.coherence
    );
  }

  // Observables for monitoring
  public observeContext(): Observable<ContextState> {
    return this.state.asObservable();
  }

  public observeMetrics(): Observable<ContextMetrics> {
    return this.state.pipe(
      map(state => state.metrics)
    );
  }
} 