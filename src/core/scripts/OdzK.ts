import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, distinctUntilChanged } from 'rxjs/operators';
import { FlowEngine, FlowPattern, FlowType, FlowContext } from './FlowEngine';

export interface SpaceMetrics {
  openness: number;   // How receptive the space is
  balance: number;    // How well elements complement each other
  energy: number;     // Current energy level
}

export class FlowSpace {
  private engine: FlowEngine;
  private metrics: BehaviorSubject<SpaceMetrics>;
  private activeFlows: Set<string> = new Set();
  private lastUpdate: number = Date.now();

  constructor() {
    this.engine = new FlowEngine();
    this.metrics = new BehaviorSubject<SpaceMetrics>({
      openness: 0.7,  // Start fairly open
      balance: 0.5,   // Start neutral
      energy: 0.3     // Start gentle
    });
  }

  public async enter(type: FlowType, context: FlowContext): Promise<FlowPattern> {
    const flow = await this.engine.emergeFlow(type, context);
    this.activeFlows.add(flow.id);
    
    const intensity = this.calculateEntryIntensity();
    await this.engine.adjustFlow(flow.id, intensity);
    
    this.evolveSpace();
    return flow;
  }

  public async leave(flowId: string): Promise<void> {
    const flow = await this.engine.adjustFlow(flowId, 0);
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
    const now = Date.now();
    const timeDelta = (now - this.lastUpdate) / 1000; // seconds
    const currentMetrics = this.metrics.value;
    
    const openness = this.evolveOpenness(currentMetrics.openness, timeDelta);
    const balance = this.calculateBalance();
    const energy = this.calculateEnergy();

    this.metrics.next({ openness, balance, energy });
    this.lastUpdate = now;
  }

  private evolveOpenness(current: number, timeDelta: number): number {
    // Openness adapts based on flow count and time
    const targetOpenness = this.activeFlows.size < 3 ? 0.8 : 0.4;
    const rate = 0.1 * timeDelta;
    return current + (targetOpenness - current) * rate;
  }

  private calculateBalance(): number {
    if (this.activeFlows.size === 0) return 1;
    
    // Balance improves with moderate activity
    const optimal = 3;
    const diff = Math.abs(this.activeFlows.size - optimal);
    return Math.max(0.3, 1 - (diff * 0.15));
  }

  private calculateEnergy(): number {
    return Math.min(1, this.activeFlows.size * 0.2);
  }

  private calculateEntryIntensity(): number {
    const { openness, energy } = this.metrics.value;
    return Math.min(1, (openness + energy) / 2);
  }

  private isStateEqual(
    prev: { metrics: SpaceMetrics; flows: FlowPattern[] },
    curr: { metrics: SpaceMetrics; flows: FlowPattern[] }
  ): boolean {
    return (
      prev.metrics.openness === curr.metrics.openness &&
      prev.metrics.balance === curr.metrics.balance &&
      prev.metrics.energy === curr.metrics.energy &&
      prev.flows.length === curr.flows.length &&
      prev.flows.every((flow, i) => flow.id === curr.flows[i].id)
    );
  }
} 