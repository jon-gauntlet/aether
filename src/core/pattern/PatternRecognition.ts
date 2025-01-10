import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, mergeMap, filter, debounceTime } from 'rxjs/operators';
import { FlowState, FlowMetrics } from '../flow/NaturalFlow';

export interface Pattern {
  id: string;
  type: 'flow' | 'energy' | 'context';
  strength: number;
  confidence: number;
  metrics: {
    depth: number;
    breadth: number;
    coherence: number;
  };
}

export interface PatternMatch {
  pattern: Pattern;
  quality: number;
  context: any;
}

export class PatternRecognition {
  private patterns$ = new BehaviorSubject<Pattern[]>([]);
  private activeMatches$ = new BehaviorSubject<PatternMatch[]>([]);

  // Natural timing thresholds
  private readonly RECOGNITION_THRESHOLD = 0.618033988749895;  // Golden ratio
  private readonly CONFIDENCE_THRESHOLD = 0.414213562373095;   // Silver ratio
  private readonly COHERENCE_THRESHOLD = 0.302775637731995;    // Bronze ratio

  constructor() {
    this.initializePatternRecognition();
  }

  private initializePatternRecognition(): void {
    // Start with foundational patterns
    this.patterns$.next([
      {
        id: 'natural-flow',
        type: 'flow',
        strength: this.RECOGNITION_THRESHOLD,
        confidence: 1,
        metrics: {
          depth: this.RECOGNITION_THRESHOLD,
          breadth: this.CONFIDENCE_THRESHOLD,
          coherence: this.COHERENCE_THRESHOLD
        }
      },
      {
        id: 'energy-preservation',
        type: 'energy',
        strength: this.CONFIDENCE_THRESHOLD,
        confidence: 1,
        metrics: {
          depth: this.CONFIDENCE_THRESHOLD,
          breadth: this.COHERENCE_THRESHOLD,
          coherence: this.RECOGNITION_THRESHOLD
        }
      },
      {
        id: 'context-harmony',
        type: 'context',
        strength: this.COHERENCE_THRESHOLD,
        confidence: 1,
        metrics: {
          depth: this.COHERENCE_THRESHOLD,
          breadth: this.RECOGNITION_THRESHOLD,
          coherence: this.CONFIDENCE_THRESHOLD
        }
      }
    ]);
  }

  // Pattern recognition based on flow state
  public recognizeFlowPatterns(flowState: FlowState, metrics: FlowMetrics): void {
    const patterns = this.patterns$.value;
    const matches = patterns
      .map(pattern => {
        const quality = this.calculatePatternQuality(pattern, flowState, metrics);
        return {
          pattern,
          quality,
          context: { flowState, metrics }
        };
      })
      .filter(match => match.quality >= this.COHERENCE_THRESHOLD);

    this.activeMatches$.next(matches);
  }

  private calculatePatternQuality(
    pattern: Pattern,
    flowState: FlowState,
    metrics: FlowMetrics
  ): number {
    // Weight factors based on natural proportions
    const weights = {
      intensity: 0.618033988749895,
      coherence: 0.414213562373095,
      resonance: 0.302775637731995
    };

    return (
      pattern.strength * weights.intensity +
      (flowState.coherence * pattern.metrics.coherence) * weights.coherence +
      (metrics.stability * pattern.metrics.depth) * weights.resonance
    ) / (weights.intensity + weights.coherence + weights.resonance);
  }

  // Pattern evolution
  public evolvePattern(patternId: string, metrics: Partial<Pattern['metrics']>): void {
    const patterns = this.patterns$.value;
    const updated = patterns.map(pattern => {
      if (pattern.id === patternId) {
        return {
          ...pattern,
          metrics: {
            ...pattern.metrics,
            ...metrics
          }
        };
      }
      return pattern;
    });

    this.patterns$.next(updated);
  }

  // Pattern observation
  public observePatterns(): Observable<Pattern[]> {
    return this.patterns$.asObservable();
  }

  // Active match observation
  public observeMatches(): Observable<PatternMatch[]> {
    return this.activeMatches$.pipe(
      debounceTime(this.COHERENCE_THRESHOLD * 1000)  // Natural timing
    );
  }

  // Pattern quality monitoring
  public observeQuality(): Observable<number> {
    return this.activeMatches$.pipe(
      map(matches => {
        if (matches.length === 0) return 0;
        return matches.reduce((acc, match) => acc + match.quality, 0) / matches.length;
      }),
      filter(quality => quality >= 0 && quality <= 1)
    );
  }

  // Pattern emergence monitoring
  public observeEmergence(): Observable<Pattern[]> {
    return this.patterns$.pipe(
      map(patterns => 
        patterns.filter(p => 
          p.strength >= this.RECOGNITION_THRESHOLD && 
          p.confidence >= this.CONFIDENCE_THRESHOLD
        )
      )
    );
  }
} 