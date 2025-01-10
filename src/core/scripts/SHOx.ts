import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { FlowContext, FlowProtection, NaturalFlowType, FlowMetrics } from '../types/base';

export interface HyperfocusMetrics extends FlowMetrics {
  intensity: number;
  duration: number;
  contextRetention: number;
}

export class FlowStateGuardian {
  private contexts: Map<string, BehaviorSubject<FlowContext>> = new Map();
  private protections: Map<string, BehaviorSubject<FlowProtection>> = new Map();
  private hyperfocusStates: Map<string, BehaviorSubject<HyperfocusMetrics>> = new Map();
  
  private readonly HYPERFOCUS_THRESHOLD = 0.85;
  private readonly CONTEXT_DECAY_RATE = 0.05;
  private readonly MIN_HYPERFOCUS_DURATION = 25; // minutes

  createContext(): string {
    const id = Math.random().toString(36).substring(7);
    this.contexts.set(id, new BehaviorSubject<FlowContext>({
      depth: 0.5,
      metrics: {
        coherence: 0.5,
        stability: 0.5,
        quality: 0.5
      },
      mode: 'natural'
    }));
    
    this.protections.set(id, new BehaviorSubject<FlowProtection>({
      level: 0.5,
      type: 'soft'
    }));

    this.hyperfocusStates.set(id, new BehaviorSubject<HyperfocusMetrics>({
      coherence: 0.5,
      stability: 0.5,
      quality: 0.5,
      intensity: 0,
      duration: 0,
      contextRetention: 1
    }));

    this.initializeHyperfocusTracking(id);
    return id;
  }

  private initializeHyperfocusTracking(contextId: string) {
    const context = this.contexts.get(contextId);
    const hyperfocus = this.hyperfocusStates.get(contextId);
    
    if (!context || !hyperfocus) return;

    combineLatest([
      context,
      hyperfocus
    ]).pipe(
      debounceTime(1000),
      map(([ctx, hyper]) => this.evaluateHyperfocus(ctx, hyper))
    ).subscribe(metrics => {
      hyperfocus.next(metrics);
      this.adjustProtection(contextId, metrics);
    });
  }

  private evaluateHyperfocus(context: FlowContext, current: HyperfocusMetrics): HyperfocusMetrics {
    const newIntensity = this.calculateIntensity(context);
    const isHyperfocus = newIntensity > this.HYPERFOCUS_THRESHOLD;
    
    return {
      ...current,
      intensity: newIntensity,
      duration: isHyperfocus ? current.duration + 1 : 0,
      contextRetention: this.updateContextRetention(current.contextRetention),
      coherence: context.metrics.coherence,
      stability: context.metrics.stability,
      quality: context.metrics.quality
    };
  }

  private calculateIntensity(context: FlowContext): number {
    return (
      context.metrics.coherence * 0.4 +
      context.metrics.stability * 0.3 +
      context.metrics.quality * 0.3
    );
  }

  private updateContextRetention(current: number): number {
    return Math.max(0, current - this.CONTEXT_DECAY_RATE);
  }

  private adjustProtection(contextId: string, metrics: HyperfocusMetrics) {
    const protection = this.protections.get(contextId);
    if (!protection) return;

    const isDeepHyperfocus = metrics.intensity > this.HYPERFOCUS_THRESHOLD && 
                            metrics.duration >= this.MIN_HYPERFOCUS_DURATION;

    protection.next({
      level: isDeepHyperfocus ? 0.9 : 0.5,
      type: isDeepHyperfocus ? 'hard' : 'soft'
    });
  }

  setMode(contextId: string, mode: NaturalFlowType): void {
    const context = this.contexts.get(contextId);
    if (context) {
      context.next({
        ...context.value,
        mode
      });
    }
  }

  observeContext(contextId: string): Observable<FlowContext> {
    return this.contexts.get(contextId) as Observable<FlowContext>;
  }

  observeProtection(contextId: string): Observable<FlowProtection> {
    return this.protections.get(contextId) as Observable<FlowProtection>;
  }

  observeHyperfocus(contextId: string): Observable<HyperfocusMetrics> {
    return this.hyperfocusStates.get(contextId) as Observable<HyperfocusMetrics>;
  }
} 