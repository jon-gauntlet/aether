import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { NaturalFlow, FlowState, FlowMetrics } from '../flow/NaturalFlow';
import { PatternRecognition, Pattern } from '../patterns/PatternRecognition';
import { ContextPreservation, ContextState, ContextMetrics } from '../context/ContextPreservation';

export interface SystemState {
  flow: FlowState;
  flowMetrics: FlowMetrics;
  patterns: Pattern[];
  context: ContextState[];
  contextMetrics: ContextMetrics;
  protection: boolean;
  quality: number;
}

export class NaturalSystem {
  private flow: NaturalFlow;
  private patterns: PatternRecognition;
  private context: ContextPreservation;
  
  private systemState$ = new BehaviorSubject<SystemState>({
    flow: {
      intensity: 0.618033988749895,
      coherence: 0.414213562373095,
      resonance: 0.302775637731995,
      protection: 1
    },
    flowMetrics: {
      depth: 0,
      breadth: 0,
      stability: 0
    },
    patterns: [],
    context: [],
    contextMetrics: {
      coherence: 0.618033988749895,
      stability: 0.414213562373095,
      preservation: 0.302775637731995
    },
    protection: true,
    quality: 1
  });

  constructor() {
    this.flow = new NaturalFlow();
    this.patterns = new PatternRecognition();
    this.context = new ContextPreservation();
    
    this.initializeSystem();
  }

  private initializeSystem(): void {
    // Combine all observables
    combineLatest([
      this.flow.observeFlow(),
      this.flow.observeMetrics(),
      this.patterns.observePatterns(),
      this.context.observeContext(),
      this.context.observeMetrics(),
      this.flow.observeProtection(),
      this.context.observeQuality()
    ]).pipe(
      debounceTime(1000)  // Natural system rhythm
    ).subscribe(([
      flow,
      flowMetrics,
      patterns,
      context,
      contextMetrics,
      protection,
      quality
    ]) => {
      // Update system state
      this.systemState$.next({
        flow,
        flowMetrics,
        patterns,
        context,
        contextMetrics,
        protection,
        quality
      });

      // Natural system evolution
      this.evolveSystem(flow, flowMetrics, patterns);
    });
  }

  private evolveSystem(
    flow: FlowState,
    metrics: FlowMetrics,
    patterns: Pattern[]
  ): void {
    // Pattern recognition
    this.patterns.recognizeFlowPatterns(flow, metrics);

    // Context preservation
    this.context.preserveContext(flow, metrics, patterns);

    // Flow protection
    const protection = this.calculateProtection(flow, metrics, patterns);
    this.flow.protectFlow(protection);
  }

  private calculateProtection(
    flow: FlowState,
    metrics: FlowMetrics,
    patterns: Pattern[]
  ): number {
    const weights = {
      flow: 0.618033988749895,
      metrics: 0.414213562373095,
      patterns: 0.302775637731995
    };

    const flowProtection = flow.protection;
    const metricsProtection = metrics.stability;
    const patternsProtection = patterns.length > 0
      ? patterns.reduce((acc, p) => acc + p.confidence, 0) / patterns.length
      : 0;

    return Math.min(
      1,
      (flowProtection * weights.flow +
       metricsProtection * weights.metrics +
       patternsProtection * weights.patterns) /
      (weights.flow + weights.metrics + weights.patterns)
    );
  }

  // Public interface
  public observeSystem(): Observable<SystemState> {
    return this.systemState$.asObservable();
  }

  public observeQuality(): Observable<number> {
    return this.systemState$.pipe(
      map(state => state.quality),
      distinctUntilChanged()
    );
  }

  public observeProtection(): Observable<boolean> {
    return this.systemState$.pipe(
      map(state => state.protection),
      distinctUntilChanged()
    );
  }

  // System control
  public protectFlow(intensity: number): void {
    this.flow.protectFlow(intensity);
  }

  public evolvePattern(patternId: string, metrics: Partial<Pattern['metrics']>): void {
    this.patterns.evolvePattern(patternId, metrics);
  }

  // System metrics
  public getSystemMetrics(): Observable<{
    quality: number;
    protection: boolean;
    coherence: number;
    stability: number;
  }> {
    return this.systemState$.pipe(
      map(state => ({
        quality: state.quality,
        protection: state.protection,
        coherence: state.contextMetrics.coherence,
        stability: state.contextMetrics.stability
      })),
      distinctUntilChanged((prev, curr) => 
        prev.quality === curr.quality &&
        prev.protection === curr.protection &&
        prev.coherence === curr.coherence &&
        prev.stability === curr.stability
      )
    );
  }
} 