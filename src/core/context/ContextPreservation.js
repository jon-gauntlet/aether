import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { Pattern } from '../patterns/PatternRecognition';
import { FlowState, FlowMetrics } from '../flow/NaturalFlow';

export interface ContextState {
  id: string;
  type: 'flow' | 'pattern' | 'system';
  depth: number;
  presence: number;
  flow: FlowState;
  metrics: FlowMetrics;
  protection: number;
  timestamp: number;
}

export interface ContextMetrics {
  coherence: number;
  stability: number;
  preservation: number;
}

export class ContextPreservation {
  private context$ = new BehaviorSubject<ContextState[]>([]);
  private metrics$ = new BehaviorSubject<ContextMetrics>({
    coherence: 0.618033988749895,  // Golden ratio
    stability: 0.414213562373095,   // Silver ratio
    preservation: 0.302775637731995  // Bronze ratio
  });

  // Natural timing cycles (ms)
  private readonly PRESERVATION_CYCLE = 5000;
  private readonly COHERENCE_CYCLE = 8000;
  private readonly STABILITY_CYCLE = 13000;

  constructor() {
    this.initializePreservation();
  }

  private initializePreservation(): void {
    // Preservation cycle
    setInterval(() => {
      this.evolveMetrics({ preservation: this.calculatePreservation() });
    }, this.PRESERVATION_CYCLE);

    // Coherence cycle
    setInterval(() => {
      this.evolveMetrics({ coherence: this.calculateCoherence() });
    }, this.COHERENCE_CYCLE);

    // Stability cycle
    setInterval(() => {
      this.evolveMetrics({ stability: this.calculateStability() });
    }, this.STABILITY_CYCLE);
  }

  // Context state management
  public preserveContext(
    flowState: FlowState,
    metrics: FlowMetrics,
    patterns: Pattern[]
  ): void {
    const timestamp = Date.now();
    const newContext: ContextState = {
      id: `ctx_${timestamp}`,
      type: 'flow',
      depth: this.calculateDepth(patterns),
      presence: this.calculatePresence(flowState),
      flow: flowState,
      metrics,
      protection: this.calculateProtection(flowState, metrics),
      timestamp
    };

    const current = this.context$.value;
    this.context$.next([...current, newContext]);
  }

  private calculateDepth(patterns: Pattern[]): number {
    if (patterns.length === 0) return 0;
    return patterns.reduce((acc, p) => acc + p.metrics.depth, 0) / patterns.length;
  }

  private calculatePresence(flowState: FlowState): number {
    return (
      flowState.intensity * 0.618033988749895 +
      flowState.coherence * 0.414213562373095 +
      flowState.resonance * 0.302775637731995
    ) / (0.618033988749895 + 0.414213562373095 + 0.302775637731995);
  }

  private calculateProtection(flowState: FlowState, metrics: FlowMetrics): number {
    return Math.min(
      1,
      (flowState.protection * 0.6) +
      (metrics.stability * 0.4)
    );
  }

  private calculatePreservation(): number {
    const contexts = this.context$.value;
    if (contexts.length === 0) return 0;
    
    const recentContexts = contexts.filter(
      ctx => Date.now() - ctx.timestamp < this.PRESERVATION_CYCLE
    );
    
    return recentContexts.reduce((acc, ctx) => acc + ctx.protection, 0) / recentContexts.length;
  }

  private calculateCoherence(): number {
    const contexts = this.context$.value;
    if (contexts.length < 2) return 1;

    const coherenceScores = contexts.slice(1).map((ctx, i) => {
      const prev = contexts[i];
      return Math.min(
        1,
        (ctx.presence * 0.4) +
        (ctx.protection * 0.3) +
        (prev.protection * 0.3)
      );
    });

    return coherenceScores.reduce((acc, score) => acc + score, 0) / coherenceScores.length;
  }

  private calculateStability(): number {
    const contexts = this.context$.value;
    if (contexts.length === 0) return 0;

    const stabilityScores = contexts.map(ctx =>
      (ctx.depth * 0.4) +
      (ctx.presence * 0.3) +
      (ctx.protection * 0.3)
    );

    return stabilityScores.reduce((acc, score) => acc + score, 0) / stabilityScores.length;
  }

  // Metrics evolution
  private evolveMetrics(update: Partial<ContextMetrics>): void {
    const current = this.metrics$.value;
    this.metrics$.next({
      ...current,
      ...update
    });
  }

  // Context observation
  public observeContext(): Observable<ContextState[]> {
    return this.context$.asObservable();
  }

  // Metrics observation
  public observeMetrics(): Observable<ContextMetrics> {
    return this.metrics$.asObservable();
  }

  // Context quality monitoring
  public observeQuality(): Observable<number> {
    return combineLatest([
      this.context$,
      this.metrics$
    ]).pipe(
      map(([contexts, metrics]) => {
        if (contexts.length === 0) return 0;
        const recentContexts = contexts.filter(
          ctx => Date.now() - ctx.timestamp < this.PRESERVATION_CYCLE * 2
        );
        if (recentContexts.length === 0) return 0;

        return (
          metrics.coherence * 0.4 +
          metrics.stability * 0.3 +
          metrics.preservation * 0.3
        );
      }),
      distinctUntilChanged(),
      debounceTime(this.PRESERVATION_CYCLE / 2)
    );
  }

  // Context protection monitoring
  public observeProtection(): Observable<boolean> {
    return this.metrics$.pipe(
      map(metrics => 
        metrics.preservation >= 0.618033988749895 && 
        metrics.stability >= 0.414213562373095
      ),
      distinctUntilChanged()
    );
  }
} 