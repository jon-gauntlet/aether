import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, filter, mergeMap } from 'rxjs/operators';

export type FlowType = 'text' | 'voice' | 'visual' | 'spatial';
export type FlowContext = Record<string, any>;

export interface FlowMetrics {
  naturalness: number;  // 0-1: how organic the flow feels
  effectiveness: number;  // 0-1: how well information is transmitted
  resonance: number;  // 0-1: how well it connects with users
}

export interface FlowPattern {
  id: string;
  type: FlowType;
  context: FlowContext;
  metrics: FlowMetrics;
  history: Array<{ timestamp: number; metrics: FlowMetrics }>;
}

export class FlowEngine {
  private patterns = new Map<string, FlowPattern>();
  private activeFlows = new BehaviorSubject<Set<string>>(new Set());
  private flowUpdates = new Subject<FlowPattern>();

  // Natural emergence of flows
  public observeFlows(context: FlowContext): Observable<FlowPattern[]> {
    return this.flowUpdates.pipe(
      filter(pattern => this.matchesContext(pattern.context, context)),
      map(() => this.getCurrentPatterns())
    );
  }

  // Let a new flow emerge naturally
  public async emergeFlow(type: FlowType, context: FlowContext): Promise<FlowPattern> {
    const pattern: FlowPattern = {
      id: this.generateNaturalId(),
      type,
      context,
      metrics: this.initializeNaturalMetrics(),
      history: []
    };

    this.patterns.set(pattern.id, pattern);
    this.activeFlows.next(this.activeFlows.value.add(pattern.id));
    this.flowUpdates.next(pattern);

    return pattern;
  }

  // Allow flow to adapt naturally
  public async adaptFlow(id: string, context: FlowContext): Promise<FlowPattern> {
    const pattern = this.patterns.get(id);
    if (!pattern) throw new Error('Flow pattern not found');

    const adaptedPattern = {
      ...pattern,
      context: this.mergeContexts(pattern.context, context),
      metrics: this.evolveMetrics(pattern.metrics),
      history: [
        ...pattern.history,
        { timestamp: Date.now(), metrics: pattern.metrics }
      ]
    };

    this.patterns.set(id, adaptedPattern);
    this.flowUpdates.next(adaptedPattern);

    return adaptedPattern;
  }

  // Let flow naturally subside
  public async subsideFlow(id: string): Promise<void> {
    const pattern = this.patterns.get(id);
    if (!pattern) return;

    // Record final state before subsiding
    pattern.history.push({
      timestamp: Date.now(),
      metrics: pattern.metrics
    });

    this.patterns.delete(id);
    const newActive = new Set(this.activeFlows.value);
    newActive.delete(id);
    this.activeFlows.next(newActive);
  }

  // Natural helper methods
  private generateNaturalId(): string {
    return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeNaturalMetrics(): FlowMetrics {
    return {
      naturalness: 0.5,  // Start at middle, let it evolve
      effectiveness: 0.5,
      resonance: 0.5
    };
  }

  private evolveMetrics(current: FlowMetrics): FlowMetrics {
    // Subtle random variations to allow for natural evolution
    const evolve = (value: number) => {
      const change = (Math.random() - 0.5) * 0.1; // Small random change
      return Math.max(0, Math.min(1, value + change));
    };

    return {
      naturalness: evolve(current.naturalness),
      effectiveness: evolve(current.effectiveness),
      resonance: evolve(current.resonance)
    };
  }

  private matchesContext(patternContext: FlowContext, queryContext: FlowContext): boolean {
    return Object.entries(queryContext).every(
      ([key, value]) => patternContext[key] === value
    );
  }

  private mergeContexts(old: FlowContext, update: FlowContext): FlowContext {
    return { ...old, ...update };
  }

  private getCurrentPatterns(): FlowPattern[] {
    return Array.from(this.patterns.values());
  }
} 