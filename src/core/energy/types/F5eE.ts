import { BehaviorSubject, Observable } from 'rxjs';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy } from '../energy/types';

export interface MindSpaceMetrics {
  clarity: number;
  depth: number;
  focus: number;
  presence: number;
  integration: number;
}

export interface MindRegion {
  id: string;
  name: string;
  fields: Field[];
  metrics: MindSpaceMetrics;
  boundaries: {
    min: number;
    max: number;
    threshold: number;
  };
  connections: string[]; // IDs of connected regions
}

export interface MindSpaceState {
  regions: MindRegion[];
  activeRegion: MindRegion | null;
  metrics: MindSpaceMetrics;
  capacity: number;
  utilization: number;
  isStable: boolean;
}

export class MindSpaceSystem {
  private state$: BehaviorSubject<MindSpaceState>;
  private readonly MAX_REGIONS = 7;
  private readonly STABILITY_THRESHOLD = 0.7;
  private readonly CAPACITY_THRESHOLD = 0.8;

  constructor() {
    this.state$ = new BehaviorSubject<MindSpaceState>({
      regions: [],
      activeRegion: null,
      metrics: {
        clarity: 1.0,
        depth: 1.0,
        focus: 1.0,
        presence: 1.0,
        integration: 1.0
      },
      capacity: 100,
      utilization: 0,
      isStable: true
    });
  }

  public getState(): Observable<MindSpaceState> {
    return this.state$.asObservable();
  }

  public createRegion(
    name: string,
    boundaries: {
      min: number;
      max: number;
      threshold: number;
    }
  ): boolean {
    const currentState = this.state$.getValue();
    if (currentState.regions.length >= this.MAX_REGIONS) return false;

    const region: MindRegion = {
      id: this.generateId(),
      name,
      fields: [],
      metrics: {
        clarity: 1.0,
        depth: 1.0,
        focus: 1.0,
        presence: 1.0,
        integration: 1.0
      },
      boundaries,
      connections: []
    };

    this.state$.next({
      ...currentState,
      regions: [...currentState.regions, region],
      metrics: this.calculateSpaceMetrics(
        [...currentState.regions, region],
        currentState.activeRegion
      )
    });

    return true;
  }

  public addField(field: Field, regionId: string): boolean {
    const currentState = this.state$.getValue();
    const region = currentState.regions.find(r => r.id === regionId);
    if (!region) return false;

    const newUtilization = this.calculateUtilization(
      [...region.fields, field]
    );

    if (newUtilization > this.CAPACITY_THRESHOLD) return false;

    const updatedRegions = currentState.regions.map(r =>
      r.id === regionId
        ? { ...r, fields: [...r.fields, field] }
        : r
    );

    const metrics = this.calculateSpaceMetrics(
      updatedRegions,
      currentState.activeRegion
    );

    this.state$.next({
      ...currentState,
      regions: updatedRegions,
      metrics,
      utilization: this.calculateTotalUtilization(updatedRegions),
      isStable: this.checkStability(metrics)
    });

    return true;
  }

  public activateRegion(regionId: string): void {
    const currentState = this.state$.getValue();
    const region = currentState.regions.find(r => r.id === regionId);
    if (!region) return;

    this.state$.next({
      ...currentState,
      activeRegion: region,
      metrics: this.calculateSpaceMetrics(
        currentState.regions,
        region
      )
    });
  }

  public connectRegions(regionId1: string, regionId2: string): boolean {
    const currentState = this.state$.getValue();
    const region1 = currentState.regions.find(r => r.id === regionId1);
    const region2 = currentState.regions.find(r => r.id === regionId2);

    if (!region1 || !region2) return false;
    if (region1.connections.includes(regionId2)) return true;

    const updatedRegions = currentState.regions.map(r => {
      if (r.id === regionId1) {
        return { ...r, connections: [...r.connections, regionId2] };
      }
      if (r.id === regionId2) {
        return { ...r, connections: [...r.connections, regionId1] };
      }
      return r;
    });

    const metrics = this.calculateSpaceMetrics(
      updatedRegions,
      currentState.activeRegion
    );

    this.state$.next({
      ...currentState,
      regions: updatedRegions,
      metrics,
      isStable: this.checkStability(metrics)
    });

    return true;
  }

  public handleFlowTransition(
    newState: FlowState,
    consciousness: ConsciousnessState
  ): void {
    const currentState = this.state$.getValue();
    let metrics = { ...currentState.metrics };

    switch (newState) {
      case FlowState.FLOW:
        metrics.clarity *= 1.1;
        metrics.depth *= 1.2;
        break;
      case FlowState.RECOVERING:
        metrics.presence *= 1.2;
        metrics.integration *= 0.9;
        break;
      case FlowState.TRANSITIONING:
        metrics.focus *= 0.9;
        metrics.clarity *= 0.8;
        break;
      default:
        break;
    }

    // Normalize metrics
    metrics = {
      clarity: Math.min(1, metrics.clarity),
      depth: Math.min(1, metrics.depth),
      focus: Math.min(1, metrics.focus),
      presence: Math.min(1, metrics.presence),
      integration: Math.min(1, metrics.integration)
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
      currentState.regions,
      currentState.activeRegion,
      consciousness
    );

    this.state$.next({
      ...currentState,
      metrics,
      isStable: this.checkStability(metrics)
    });
  }

  private calculateSpaceMetrics(
    regions: MindRegion[],
    activeRegion: MindRegion | null,
    consciousness?: ConsciousnessState
  ): MindSpaceMetrics {
    if (regions.length === 0) {
      return {
        clarity: 1.0,
        depth: 1.0,
        focus: 1.0,
        presence: 1.0,
        integration: 1.0
      };
    }

    const clarity = this.calculateClarity(regions, activeRegion);
    const depth = this.calculateDepth(regions);
    const focus = activeRegion ? this.calculateFocus(activeRegion) : 1.0;
    const presence = consciousness
      ? consciousness.metrics.depth
      : this.calculatePresence(regions);
    const integration = this.calculateIntegration(regions);

    return {
      clarity: Math.min(1, clarity),
      depth: Math.min(1, depth),
      focus: Math.min(1, focus),
      presence: Math.min(1, presence),
      integration: Math.min(1, integration)
    };
  }

  private calculateClarity(
    regions: MindRegion[],
    activeRegion: MindRegion | null
  ): number {
    if (!activeRegion) return 1.0;

    const connectedRegions = regions.filter(r =>
      activeRegion.connections.includes(r.id)
    );

    const activeClarity = activeRegion.fields.reduce((sum, field) =>
      sum + field.resonance.coherence, 0
    ) / Math.max(1, activeRegion.fields.length);

    const connectionClarity = connectedRegions.reduce((sum, region) =>
      sum + region.metrics.clarity, 0
    ) / Math.max(1, connectedRegions.length);

    return (activeClarity * 0.7 + connectionClarity * 0.3);
  }

  private calculateDepth(regions: MindRegion[]): number {
    return regions.reduce((sum, region) =>
      sum + region.fields.reduce((fieldSum, field) =>
        fieldSum + field.resonance.amplitude, 0
      ), 0) / (regions.length * this.CAPACITY_THRESHOLD);
  }

  private calculateFocus(region: MindRegion): number {
    const fieldFocus = region.fields.reduce((sum, field) =>
      sum + field.strength * field.resonance.coherence, 0
    ) / Math.max(1, region.fields.length);

    const boundaryFocus = (region.boundaries.max - region.boundaries.min) /
      region.boundaries.threshold;

    return (fieldFocus * 0.7 + boundaryFocus * 0.3);
  }

  private calculatePresence(regions: MindRegion[]): number {
    return regions.reduce((sum, region) =>
      sum + region.metrics.presence, 0
    ) / regions.length;
  }

  private calculateIntegration(regions: MindRegion[]): number {
    if (regions.length < 2) return 1;

    const totalConnections = regions.reduce((sum, region) =>
      sum + region.connections.length, 0
    );

    const maxPossibleConnections = regions.length * (regions.length - 1);
    const connectionDensity = totalConnections / maxPossibleConnections;

    const regionIntegration = regions.reduce((sum, region) =>
      sum + region.metrics.integration, 0
    ) / regions.length;

    return (connectionDensity * 0.6 + regionIntegration * 0.4);
  }

  private calculateUtilization(fields: Field[]): number {
    return Math.min(1, fields.length / this.CAPACITY_THRESHOLD);
  }

  private calculateTotalUtilization(regions: MindRegion[]): number {
    const totalFields = regions.reduce((sum, region) =>
      sum + region.fields.length, 0
    );
    return Math.min(1, totalFields / (this.CAPACITY_THRESHOLD * this.MAX_REGIONS));
  }

  private checkStability(metrics: MindSpaceMetrics): boolean {
    const stabilityScore = (
      metrics.clarity * 0.3 +
      metrics.depth * 0.2 +
      metrics.focus * 0.2 +
      metrics.presence * 0.1 +
      metrics.integration * 0.2
    );

    return stabilityScore >= this.STABILITY_THRESHOLD;
  }

  private generateId(): string {
    return `region_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 