import { BehaviorSubject, Observable } from 'rxjs';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState, ConsciousnessMetrics, FlowSpace } from '../types/consciousness';

export class ConsciousnessSystem {
  private state$: BehaviorSubject<ConsciousnessState>;
  private readonly MAX_HISTORY = 100;

  constructor() {
    this.state$ = new BehaviorSubject<ConsciousnessState>({
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
      lastTransition: new Date(),
      stateHistory: [],
      metrics: {
        clarity: 1.0,
        depth: 1.0,
        coherence: 1.0,
        integration: 1.0,
        flexibility: 1.0
      }
    });
  }

  public getState(): Observable<ConsciousnessState> {
    return this.state$.asObservable();
  }

  public updateState(newState: FlowState): void {
    const currentState = this.state$.getValue();
    const now = new Date();
    const duration = now.getTime() - currentState.lastTransition.getTime();

    this.state$.next({
      ...currentState,
      currentState: newState,
      lastTransition: now,
      stateHistory: this.addToHistory(currentState.stateHistory, {
        timestamp: now,
        state: currentState.currentState,
        duration
      })
    });
  }

  public updateMetrics(updates: Partial<ConsciousnessMetrics>): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      metrics: {
        ...currentState.metrics,
        ...updates
      }
    });
  }

  public addField(field: Field): void {
    const currentState = this.state$.getValue();
    
    if (!currentState.fields.find(f => f.id === field.id)) {
      this.state$.next({
        ...currentState,
        fields: [...currentState.fields, field],
        flowSpace: {
          ...currentState.flowSpace,
          fields: [...currentState.flowSpace.fields, field],
          utilization: this.calculateUtilization([...currentState.flowSpace.fields, field])
        }
      });
    }
  }

  public removeField(fieldId: string): void {
    const currentState = this.state$.getValue();
    const updatedFields = currentState.fields.filter(f => f.id !== fieldId);
    const updatedSpaceFields = currentState.flowSpace.fields.filter(f => f.id !== fieldId);

    this.state$.next({
      ...currentState,
      fields: updatedFields,
      flowSpace: {
        ...currentState.flowSpace,
        fields: updatedSpaceFields,
        utilization: this.calculateUtilization(updatedSpaceFields)
      }
    });
  }

  public updateFlowSpace(updates: Partial<FlowSpace>): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      flowSpace: {
        ...currentState.flowSpace,
        ...updates
      }
    });
  }

  public getStateHistory(): Array<{
    timestamp: Date;
    state: FlowState;
    duration: number;
  }> {
    return this.state$.getValue().stateHistory;
  }

  public calculateMetrics(): ConsciousnessMetrics {
    const currentState = this.state$.getValue();
    const { fields, flowSpace, stateHistory } = currentState;

    // Calculate clarity based on field resonance
    const clarity = fields.reduce((sum, field) => 
      sum + field.resonance.amplitude * field.resonance.frequency, 0) / (fields.length || 1);

    // Calculate depth based on field protection and flow space utilization
    const depth = (
      fields.reduce((sum, field) => sum + field.protection.shields, 0) / (fields.length || 1) +
      flowSpace.utilization
    ) / 2;

    // Calculate coherence based on field interactions
    const coherence = this.calculateFieldCoherence(fields);

    // Calculate integration based on state history stability
    const integration = this.calculateStateIntegration(stateHistory);

    // Calculate flexibility based on transition success rate
    const flexibility = this.calculateStateFlexibility(stateHistory);

    return {
      clarity: Math.max(0, Math.min(1, clarity)),
      depth: Math.max(0, Math.min(1, depth)),
      coherence: Math.max(0, Math.min(1, coherence)),
      integration: Math.max(0, Math.min(1, integration)),
      flexibility: Math.max(0, Math.min(1, flexibility))
    };
  }

  private addToHistory(
    history: Array<{
      timestamp: Date;
      state: FlowState;
      duration: number;
    }>,
    entry: {
      timestamp: Date;
      state: FlowState;
      duration: number;
    }
  ): Array<{
    timestamp: Date;
    state: FlowState;
    duration: number;
  }> {
    const updatedHistory = [...history, entry];
    if (updatedHistory.length > this.MAX_HISTORY) {
      return updatedHistory.slice(-this.MAX_HISTORY);
    }
    return updatedHistory;
  }

  private calculateUtilization(fields: Field[]): number {
    if (fields.length === 0) return 0;
    return Math.min(1, fields.length / 10); // Assume max 10 fields for 100% utilization
  }

  private calculateFieldCoherence(fields: Field[]): number {
    if (fields.length < 2) return 1;

    let totalCoherence = 0;
    let interactions = 0;

    for (let i = 0; i < fields.length; i++) {
      for (let j = i + 1; j < fields.length; j++) {
        const field1 = fields[i];
        const field2 = fields[j];

        const resonanceMatch = 1 - Math.abs(
          field1.resonance.frequency - field2.resonance.frequency
        ) / Math.max(field1.resonance.frequency, field2.resonance.frequency);

        const protectionMatch = Math.min(
          field1.protection.shields,
          field2.protection.shields
        );

        totalCoherence += (resonanceMatch * 0.6 + protectionMatch * 0.4);
        interactions++;
      }
    }

    return interactions > 0 ? totalCoherence / interactions : 1;
  }

  private calculateStateIntegration(history: Array<{
    timestamp: Date;
    state: FlowState;
    duration: number;
  }>): number {
    if (history.length < 2) return 1;

    const totalDuration = history.reduce((sum, entry) => sum + entry.duration, 0);
    const avgDuration = totalDuration / history.length;
    const durationVariance = history.reduce((sum, entry) => 
      sum + Math.pow(entry.duration - avgDuration, 2), 0) / history.length;

    return 1 / (1 + durationVariance / Math.pow(avgDuration, 2));
  }

  private calculateStateFlexibility(history: Array<{
    timestamp: Date;
    state: FlowState;
    duration: number;
  }>): number {
    if (history.length < 2) return 1;

    const transitions = history.length - 1;
    const uniqueStates = new Set(history.map(h => h.state)).size;
    const avgDuration = history.reduce((sum, h) => sum + h.duration, 0) / history.length;

    return (
      (uniqueStates / Object.keys(FlowState).length) * 0.4 +
      (Math.min(transitions, 10) / 10) * 0.3 +
      (Math.min(avgDuration, 3600000) / 3600000) * 0.3
    );
  }
} 