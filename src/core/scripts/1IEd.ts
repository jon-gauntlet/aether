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
  autonomousMetrics?: {
    continuity: number;
    efficiency: number;
    adaptability: number;
  };
}

export class NaturalSystem {
  private flow: NaturalFlow;
  private patterns: PatternRecognition;
  private context: ContextPreservation;
  private autonomousMode: boolean = false;
  private executionMetrics = {
    continuity: 0,
    efficiency: 0,
    adaptability: 0
  };
  
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
    quality: 1,
    autonomousMetrics: {
      continuity: 0.618033988749895,
      efficiency: 0.414213562373095,
      adaptability: 0.302775637731995
    }
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

    // Autonomous execution updates
    if (this.autonomousMode) {
      this.updateExecutionMetrics(flow, metrics, patterns);
      this.adaptSystem();
    }
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

  private updateExecutionMetrics(
    flow: FlowState,
    metrics: FlowMetrics,
    patterns: Pattern[]
  ): void {
    this.executionMetrics = {
      continuity: flow.coherence * 0.618033988749895 + flow.protection * 0.381966011250105,
      efficiency: metrics.stability * 0.618033988749895 + patterns.length * 0.381966011250105 / 10,
      adaptability: patterns.reduce((acc, p) => acc + p.confidence, 0) / patterns.length
    };
  }

  private adaptSystem(): void {
    const { continuity, efficiency, adaptability } = this.executionMetrics;
    
    // Adjust flow protection based on execution metrics
    const adaptiveProtection = Math.min(1, (continuity + efficiency + adaptability) / 3);
    this.protectFlow(adaptiveProtection);

    // Evolve patterns based on execution quality
    if (efficiency > 0.8) {
      const strongestPattern = this.systemState$.value.patterns
        .sort((a, b) => b.confidence - a.confidence)[0];
      if (strongestPattern) {
        this.evolvePattern(strongestPattern.id, {
          depth: Math.min(1, strongestPattern.metrics.depth + 0.1),
          breadth: Math.min(1, strongestPattern.metrics.breadth + 0.1),
          coherence: Math.min(1, strongestPattern.metrics.coherence + 0.1)
        });
      }
    }
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

  // Autonomous execution control
  public enableAutonomousMode(): void {
    this.autonomousMode = true;
    this.protectFlow(1); // Maximum flow protection
    this.evolveSystem(this.systemState$.value.flow, this.systemState$.value.flowMetrics, this.systemState$.value.patterns);
  }

  public disableAutonomousMode(): void {
    this.autonomousMode = false;
  }

  // System metrics
  public getSystemMetrics(): Observable<{
    quality: number;
    protection: boolean;
    coherence: number;
    stability: number;
    autonomousMetrics?: {
      continuity: number;
      efficiency: number;
      adaptability: number;
    };
  }> {
    return this.systemState$.pipe(
      map(state => ({
        quality: state.quality,
        protection: state.protection,
        coherence: state.contextMetrics.coherence,
        stability: state.contextMetrics.stability,
        ...(this.autonomousMode && { autonomousMetrics: this.executionMetrics })
      })),
      distinctUntilChanged((prev, curr) => 
        prev.quality === curr.quality &&
        prev.protection === curr.protection &&
        prev.coherence === curr.coherence &&
        prev.stability === curr.stability &&
        JSON.stringify(prev.autonomousMetrics) === JSON.stringify(curr.autonomousMetrics)
      )
    );
  }
} 