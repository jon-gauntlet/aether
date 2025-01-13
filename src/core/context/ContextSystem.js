import { BehaviorSubject, Observable } from 'rxjs';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy, EnergyMetrics } from '../energy/types';

export interface ContextData {
  timestamp: number;
  flowState: FlowState;
  energy: Energy;
  metrics: EnergyMetrics;
  field: Field | null;
  consciousness: ConsciousnessState;
  metadata: Record<string, any>;
}

export interface ContextState {
  current: ContextData;
  history: ContextData[];
  isTracking: boolean;
}

export class ContextSystem {
  private state$: BehaviorSubject<ContextState>;
  private readonly MAX_HISTORY = 1000;

  constructor() {
    this.state$ = new BehaviorSubject<ContextState>({
      current: this.createEmptyContext(),
      history: [],
      isTracking: false
    });
  }

  public startTracking(): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      isTracking: true
    });
  }

  public stopTracking(): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      isTracking: false
    });
  }

  public updateContext(
    flowState: FlowState,
    energy: Energy,
    metrics: EnergyMetrics,
    field: Field | null,
    consciousness: ConsciousnessState,
    metadata: Record<string, any> = {}
  ): void {
    const currentState = this.state$.getValue();
    const newContext: ContextData = {
      timestamp: Date.now(),
      flowState,
      energy,
      metrics,
      field,
      consciousness,
      metadata
    };

    if (currentState.isTracking) {
      this.state$.next({
        current: newContext,
        history: this.addToHistory(currentState.history, newContext),
        isTracking: true
      });
    } else {
      this.state$.next({
        ...currentState,
        current: newContext
      });
    }
  }

  public getContext(): Observable<ContextState> {
    return this.state$.asObservable();
  }

  public getCurrentContext(): ContextData {
    return this.state$.getValue().current;
  }

  public getHistory(): ContextData[] {
    return this.state$.getValue().history;
  }

  public getContextByTimeRange(startTime: number, endTime: number): ContextData[] {
    return this.state$.getValue().history.filter(
      context => context.timestamp >= startTime && context.timestamp <= endTime
    );
  }

  public getContextByFlowState(flowState: FlowState): ContextData[] {
    return this.state$.getValue().history.filter(
      context => context.flowState === flowState
    );
  }

  public clearHistory(): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      history: []
    });
  }

  private createEmptyContext(): ContextData {
    return {
      timestamp: Date.now(),
      flowState: FlowState.FOCUS,
      energy: {
        mental: 1.0,
        physical: 1.0,
        emotional: 1.0
      },
      metrics: {
        efficiency: 0,
        sustainability: 0,
        recovery: 0
      },
      field: null,
      consciousness: {
        currentState: FlowState.FOCUS,
        fields: [],
        flowSpace: {
          dimensions: 3,
          capacity: 100,
          utilization: 0,
          stability: 1.0,
          fields: [],
          boundaries: []
        },
        lastTransition: Date.now(),
        stateHistory: [],
        metrics: {
          clarity: 1.0,
          depth: 1.0,
          coherence: 1.0,
          integration: 1.0,
          flexibility: 1.0
        }
      },
      metadata: {}
    };
  }

  private addToHistory(history: ContextData[], newContext: ContextData): ContextData[] {
    const updatedHistory = [...history, newContext];
    if (updatedHistory.length > this.MAX_HISTORY) {
      return updatedHistory.slice(-this.MAX_HISTORY);
    }
    return updatedHistory;
  }
} 