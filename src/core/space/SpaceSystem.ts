import { BehaviorSubject, Observable } from 'rxjs';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy } from '../energy/types';

export interface SpaceMetrics {
  density: number;
  stability: number;
  flexibility: number;
  resonance: number;
  harmony: number;
}

export interface SpaceDimension {
  id: string;
  name: string;
  scale: number;
  boundaries: {
    min: number;
    max: number;
    threshold: number;
  };
  metrics: SpaceMetrics;
}

export interface SpaceState {
  dimensions: SpaceDimension[];
  activeFields: Field[];
  metrics: SpaceMetrics;
  capacity: number;
  utilization: number;
  isStable: boolean;
}

export class SpaceSystem {
  private state$: BehaviorSubject<SpaceState>;
  private readonly MAX_DIMENSIONS = 5;
  private readonly STABILITY_THRESHOLD = 0.7;
  private readonly CAPACITY_THRESHOLD = 0.8;

  constructor() {
    this.state$ = new BehaviorSubject<SpaceState>({
      dimensions: [],
      activeFields: [],
      metrics: {
        density: 0,
        stability: 1.0,
        flexibility: 1.0,
        resonance: 1.0,
        harmony: 1.0
      },
      capacity: 100,
      utilization: 0,
      isStable: true
    });
  }

  public getState(): Observable<SpaceState> {
    return this.state$.asObservable();
  }

  public addDimension(
    name: string,
    scale: number,
    boundaries: {
      min: number;
      max: number;
      threshold: number;
    }
  ): boolean {
    const currentState = this.state$.getValue();
    if (currentState.dimensions.length >= this.MAX_DIMENSIONS) return false;

    const dimension: SpaceDimension = {
      id: this.generateId(),
      name,
      scale,
      boundaries,
      metrics: {
        density: 0,
        stability: 1.0,
        flexibility: 1.0,
        resonance: 1.0,
        harmony: 1.0
      }
    };

    this.state$.next({
      ...currentState,
      dimensions: [...currentState.dimensions, dimension],
      metrics: this.calculateSpaceMetrics(
        [...currentState.dimensions, dimension],
        currentState.activeFields
      )
    });

    return true;
  }

  public addField(field: Field): boolean {
    const currentState = this.state$.getValue();
    const newUtilization = this.calculateUtilization(
      [...currentState.activeFields, field]
    );

    if (newUtilization > this.CAPACITY_THRESHOLD) return false;

    const updatedFields = [...currentState.activeFields, field];
    const metrics = this.calculateSpaceMetrics(
      currentState.dimensions,
      updatedFields
    );

    this.state$.next({
      ...currentState,
      activeFields: updatedFields,
      metrics,
      utilization: newUtilization,
      isStable: this.checkStability(metrics)
    });

    return true;
  }

  public removeField(fieldId: string): void {
    const currentState = this.state$.getValue();
    const updatedFields = currentState.activeFields.filter(f => f.id !== fieldId);
    
    const metrics = this.calculateSpaceMetrics(
      currentState.dimensions,
      updatedFields
    );

    this.state$.next({
      ...currentState,
      activeFields: updatedFields,
      metrics,
      utilization: this.calculateUtilization(updatedFields),
      isStable: this.checkStability(metrics)
    });
  }

  public handleFlowTransition(
    newState: FlowState,
    consciousness: ConsciousnessState
  ): void {
    const currentState = this.state$.getValue();
    let metrics = { ...currentState.metrics };

    switch (newState) {
      case FlowState.FLOW:
        metrics.stability *= 1.1;
        metrics.resonance *= 1.2;
        break;
      case FlowState.RECOVERING:
        metrics.flexibility *= 1.2;
        metrics.harmony *= 0.9;
        break;
      case FlowState.TRANSITIONING:
        metrics.stability *= 0.9;
        metrics.density *= 0.8;
        break;
      default:
        break;
    }

    // Normalize metrics
    metrics = {
      density: Math.min(1, metrics.density),
      stability: Math.min(1, metrics.stability),
      flexibility: Math.min(1, metrics.flexibility),
      resonance: Math.min(1, metrics.resonance),
      harmony: Math.min(1, metrics.harmony)
    };

    this.state$.next({
      ...currentState,
      metrics,
      isStable: this.checkStability(metrics)
    });
  }

  public synchronize(consciousness: ConsciousnessState): void {
    const currentState = this.state$.getValue();
    const metrics = this.calculateSpaceMetrics(
      currentState.dimensions,
      currentState.activeFields,
      consciousness
    );

    this.state$.next({
      ...currentState,
      metrics,
      isStable: this.checkStability(metrics)
    });
  }

  private calculateSpaceMetrics(
    dimensions: SpaceDimension[],
    fields: Field[],
    consciousness?: ConsciousnessState
  ): SpaceMetrics {
    if (dimensions.length === 0 || fields.length === 0) {
      return {
        density: 0,
        stability: 1.0,
        flexibility: 1.0,
        resonance: 1.0,
        harmony: 1.0
      };
    }

    const density = this.calculateDensity(fields);
    const stability = this.calculateStability(dimensions, fields);
    const flexibility = this.calculateFlexibility(dimensions);
    const resonance = this.calculateResonance(fields);
    const harmony = consciousness
      ? consciousness.metrics.coherence
      : this.calculateHarmony(fields);

    return {
      density: Math.min(1, density),
      stability: Math.min(1, stability),
      flexibility: Math.min(1, flexibility),
      resonance: Math.min(1, resonance),
      harmony: Math.min(1, harmony)
    };
  }

  private calculateDensity(fields: Field[]): number {
    const totalStrength = fields.reduce((sum, field) => sum + field.strength, 0);
    return totalStrength / (fields.length * this.CAPACITY_THRESHOLD);
  }

  private calculateStability(
    dimensions: SpaceDimension[],
    fields: Field[]
  ): number {
    const dimensionStability = dimensions.reduce((sum, dim) =>
      sum + dim.metrics.stability, 0
    ) / dimensions.length;

    const fieldStability = fields.reduce((sum, field) =>
      sum + field.stability, 0
    ) / fields.length;

    return (dimensionStability * 0.6 + fieldStability * 0.4);
  }

  private calculateFlexibility(dimensions: SpaceDimension[]): number {
    return dimensions.reduce((sum, dim) =>
      sum + (dim.boundaries.max - dim.boundaries.min) / dim.scale, 0
    ) / dimensions.length;
  }

  private calculateResonance(fields: Field[]): number {
    if (fields.length < 2) return 1;

    let totalResonance = 0;
    let interactions = 0;

    for (let i = 0; i < fields.length; i++) {
      for (let j = i + 1; j < fields.length; j++) {
        const field1 = fields[i];
        const field2 = fields[j];

        const frequencyMatch = 1 - Math.abs(
          field1.resonance.frequency - field2.resonance.frequency
        ) / Math.max(field1.resonance.frequency, field2.resonance.frequency);

        const phaseMatch = 1 - Math.abs(
          field1.resonance.phase - field2.resonance.phase
        ) / (2 * Math.PI);

        totalResonance += (frequencyMatch * 0.7 + phaseMatch * 0.3);
        interactions++;
      }
    }

    return totalResonance / interactions;
  }

  private calculateHarmony(fields: Field[]): number {
    if (fields.length < 2) return 1;

    const harmonicFields = fields.filter(field =>
      field.resonance.harmonics.length > 0
    );

    if (harmonicFields.length === 0) return 0.5;

    return harmonicFields.reduce((sum, field) =>
      sum + field.resonance.harmony, 0
    ) / harmonicFields.length;
  }

  private calculateUtilization(fields: Field[]): number {
    return Math.min(1, fields.length / this.CAPACITY_THRESHOLD);
  }

  private checkStability(metrics: SpaceMetrics): boolean {
    const stabilityScore = (
      metrics.stability * 0.4 +
      metrics.harmony * 0.3 +
      metrics.resonance * 0.3
    );

    return stabilityScore >= this.STABILITY_THRESHOLD;
  }

  private generateId(): string {
    return `dimension_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 