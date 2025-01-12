import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, distinctUntilChanged } from 'rxjs/operators';
import { FlowEngine, FlowPattern, FlowType, FlowContext } from './FlowEngine';

export interface Space {
  quiet: boolean;    // Space for inner work
  ready: boolean;    // Ready to receive
  flowing: boolean;  // Natural movement
}

export class FlowArea {
  private engine: FlowEngine;
  private state: BehaviorSubject<Space>;
  private active = new Set<string>();
  private last = Date.now();

  constructor() {
    this.engine = new FlowEngine();
    this.state = new BehaviorSubject<Space>({
      quiet: true,
      ready: true,
      flowing: false
    });
  }

  public async join(type: FlowType, context: FlowContext = {}): Promise<FlowPattern> {
    const flow = await this.engine.begin(type, context);
    this.active.add(flow.id);
    
    const strength = this.sense();
    await this.engine.adjust(flow.id, strength);
    
    this.refresh();
    return flow;
  }

  public async part(id: string): Promise<void> {
    await this.engine.adjust(id, 0);
    await this.engine.end(id);
    this.active.delete(id);
    this.refresh();
  }

  public watch(): Observable<{
    state: Space;
    flows: FlowPattern[];
  }> {
    return combineLatest([
      this.state,
      this.engine.observe()
    ]).pipe(
      map(([state, flows]) => ({ state, flows })),
      distinctUntilChanged((a, b) => this.same(a, b))
    );
  }

  private refresh(): void {
    const now = Date.now();
    const dt = (now - this.last) / 1000;
    
    const count = this.active.size;
    const quiet = count === 0;
    const ready = count < 3;
    const flowing = count > 0 && count < 5;

    this.state.next({ quiet, ready, flowing });
    this.last = now;
  }

  private sense(): number {
    const { quiet, ready, flowing } = this.state.value;
    if (!ready) return 0.2;
    if (quiet) return 0.8;
    return flowing ? 0.6 : 0.4;
  }

  private same(
    a: { state: Space; flows: FlowPattern[] },
    b: { state: Space; flows: FlowPattern[] }
  ): boolean {
    return (
      a.state.quiet === b.state.quiet &&
      a.state.ready === b.state.ready &&
      a.state.flowing === b.state.flowing &&
      a.flows.length === b.flows.length &&
      a.flows.every((f, i) => f.id === b.flows[i].id)
    );
  }
} 