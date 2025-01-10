import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Flow as FlowInterface, FlowState, FlowPattern, FlowType } from '../types/flow';
import { Connection } from '../types/consciousness';

export class Flow implements FlowInterface {
  public readonly id: string;
  public type: FlowType;
  public state: FlowState;
  public connections: Connection[];

  private stateSubject: BehaviorSubject<FlowState>;
  private patternsMap: Map<string, BehaviorSubject<FlowPattern>>;
  private connectionsSubject: BehaviorSubject<Connection[]>;

  constructor(type: FlowType = 'text') {
    this.id = `flow_${Date.now()}`;
    this.type = type;
    this.state = {
      active: false,
      depth: 'surface',
      energy: 0.5,
      resonance: 0.5,
      harmony: 0.5,
      timestamp: Date.now()
    };
    this.connections = [];

    this.stateSubject = new BehaviorSubject<FlowState>(this.state);
    this.patternsMap = new Map();
    this.connectionsSubject = new BehaviorSubject<Connection[]>(this.connections);
  }

  // Core Flow Methods
  activate(): void {
    this.updateState({
      active: true,
      timestamp: Date.now()
    });
  }

  deactivate(): void {
    this.updateState({
      active: false,
      timestamp: Date.now()
    });
  }

  // State Management
  updateState(changes: Partial<FlowState>): void {
    this.state = {
      ...this.state,
      ...changes,
      timestamp: Date.now()
    };
    this.stateSubject.next(this.state);
  }

  // Pattern Management
  addPattern(pattern: FlowPattern): void {
    this.patternsMap.set(pattern.id, new BehaviorSubject(pattern));
  }

  updatePattern(id: string, changes: Partial<FlowPattern>): void {
    const pattern = this.patternsMap.get(id);
    if (pattern) {
      pattern.next({
        ...pattern.value,
        ...changes
      });
    }
  }

  removePattern(id: string): void {
    this.patternsMap.delete(id);
  }

  // Connection Management
  addConnection(connection: Connection): void {
    this.connections = [...this.connections, connection];
    this.connectionsSubject.next(this.connections);
  }

  removeConnection(from: string, to: string): void {
    this.connections = this.connections.filter(c => !(c.from === from && c.to === to));
    this.connectionsSubject.next(this.connections);
  }

  // Observation Methods
  observeState(): Observable<FlowState> {
    return this.stateSubject.asObservable();
  }

  observePattern(id: string): Observable<FlowPattern | undefined> {
    const pattern = this.patternsMap.get(id);
    return pattern ? pattern.asObservable() : new Observable();
  }

  observePatterns(): Observable<FlowPattern[]> {
    return new Observable(subscriber => {
      const patterns = Array.from(this.patternsMap.values()).map(p => p.value);
      subscriber.next(patterns);
    });
  }

  observeConnections(): Observable<Connection[]> {
    return this.connectionsSubject.asObservable();
  }

  // Flow Metrics
  getDepth(): number {
    return this.state.energy * this.state.harmony;
  }

  getHarmony(): number {
    return this.state.harmony;
  }

  getEnergy(): number {
    return this.state.energy;
  }

  // System State
  isActive(): boolean {
    return this.state.active;
  }

  isHarmonious(): boolean {
    return this.state.harmony >= 0.7;
  }

  isDeep(): boolean {
    return this.getDepth() >= 0.7;
  }

  // Cleanup
  destroy(): void {
    this.stateSubject.complete();
    this.connectionsSubject.complete();
    this.patternsMap.forEach(pattern => pattern.complete());
  }
} 