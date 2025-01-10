import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, distinctUntilChanged } from 'rxjs/operators';
import { FlowEngine, FlowPattern, FlowType, FlowContext } from './FlowEngine';

export interface SpaceMetrics {
  depth: number;      // 0-1: how deep the space feels
  harmony: number;    // 0-1: how well flows work together
  activity: number;   // 0-1: current activity level
}

export class FlowSpace {
  private engine: FlowEngine;
  private metrics: BehaviorSubject<SpaceMetrics>;
  private activeFlows: Set<string> = new Set();

  constructor() {
    this.engine = new FlowEngine();
    this.metrics = new BehaviorSubject<SpaceMetrics>({
      depth: 0.1,     // Start shallow, deepen with use
      harmony: 0.5,   // Start balanced
      activity: 0.1   // Start quiet
    });
  }

  // Let a flow naturally enter the space
  public async enter(type: FlowType, context: FlowContext): Promise<FlowPattern> {
    const flow = await this.engine.emergeFlow(type, context);
    this.activeFlows.add(flow.id);
    this.evolveSpace();
    return flow;
  }

  // Let a flow naturally leave the space
  public async leave(flowId: string): Promise<void> {
    await this.engine.subsideFlow(flowId);
    this.activeFlows.delete(flowId);
    this.evolveSpace();
  }

  // Observe the space's natural state
  public observe(): Observable<{
    metrics: SpaceMetrics;
    flows: FlowPattern[];
  }> {
    return combineLatest([
      this.metrics,
      this.engine.observeFlows({})
    ]).pipe(
      map(([metrics, flows]) => ({ metrics, flows })),
      distinctUntilChanged((prev, curr) => 
        this.isStateEqual(prev, curr)
      )
    );
  }

  // Let the space naturally evolve
  private evolveSpace(): void {
    const currentMetrics = this.metrics.value;
    
    // Space deepens with sustained use
    const depth = this.evolveDepth(currentMetrics.depth);
    
    // Harmony changes based on flow interactions
    const harmony = this.calculateHarmony();
    
    // Activity reflects current flow intensity
    const activity = this.activeFlows.size / 10; // Normalize to 0-1

    this.metrics.next({ depth, harmony, activity });
  }

  private evolveDepth(current: number): number {
    // Depth increases slowly with use, decreases slowly with inactivity
    const targetDepth = this.activeFlows.size > 0 ? 
      Math.min(1, current + 0.01) : 
      Math.max(0.1, current - 0.005);
    
    return targetDepth;
  }

  private calculateHarmony(): number {
    if (this.activeFlows.size === 0) return 1;
    if (this.activeFlows.size === 1) return 0.8;

    // Harmony decreases with complexity but can improve with sustained interaction
    const baseHarmony = 1 - (this.activeFlows.size - 1) * 0.1;
    return Math.max(0.3, Math.min(1, baseHarmony));
  }

  private isStateEqual(
    prev: { metrics: SpaceMetrics; flows: FlowPattern[] },
    curr: { metrics: SpaceMetrics; flows: FlowPattern[] }
  ): boolean {
    return (
      prev.metrics.depth === curr.metrics.depth &&
      prev.metrics.harmony === curr.metrics.harmony &&
      prev.metrics.activity === curr.metrics.activity &&
      prev.flows.length === curr.flows.length &&
      prev.flows.every((flow, i) => flow.id === curr.flows[i].id)
    );
  }
} 