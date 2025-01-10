import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, filter, mergeMap } from 'rxjs/operators';

export type FlowType = 'text' | 'voice' | 'visual' | 'spatial';
export type FlowContext = Record<string, any>;

export interface FlowMetrics {
  clarity: number;    // How clear the information is
  connection: number; // How well it connects with others
  momentum: number;   // How smoothly information moves
}

export interface FlowState {
  active: boolean;
  intensity: number;
  lastUpdate: number;
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
  private flowStates = new Map<string, FlowState>();

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

    const state = this.flowStates.get(id) || {
      active: true,
      intensity: 0.5,
      lastUpdate: Date.now()
    };

    const adaptedPattern = {
      ...pattern,
      context: this.mergeContexts(pattern.context, context),
      metrics: this.evolveMetrics(pattern.metrics, state),
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
      clarity: 0.5,
      connection: 0.5, 
      momentum: 0.5
    };
  }

  private evolveMetrics(current: FlowMetrics, state: FlowState): FlowMetrics {
    const adapt = (value: number, target: number) => {
      const strength = state.intensity * 0.1;
      return value + (target - value) * strength;
    };

    // Subtle adjustments based on flow state
    return {
      clarity: adapt(current.clarity, state.intensity),
      connection: adapt(current.connection, state.active ? 0.8 : 0.2),
      momentum: adapt(current.momentum, state.active ? 0.7 : 0.3)
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

  public async adjustFlow(id: string, intensity: number): Promise<FlowPattern> {
    const pattern = this.patterns.get(id);
    if (!pattern) throw new Error('Flow not found');

    const state: FlowState = {
      active: intensity > 0.3,
      intensity,
      lastUpdate: Date.now()
    };
    
    this.flowStates.set(id, state);
    return this.adaptFlow(id, pattern.context);
  }
} 