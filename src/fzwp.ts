import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Flow as FlowType, FlowState, FlowPattern, Connection } from '../types';

export class Flow implements FlowType {
  private state: BehaviorSubject<FlowState>;
  private patterns: Map<string, BehaviorSubject<FlowPattern>>;
  private connections: BehaviorSubject<Connection[]>;

  constructor() {
    this.state = new BehaviorSubject<FlowState>({
      active: false,
      depth: 'surface',
      energy: 0.5,
      resonance: 0.5,
      harmony: 0.5,
      timestamp: Date.now()
    });

    this.patterns = new Map();
    this.connections = new BehaviorSubject<Connection[]>([]);
  }

  // Core Flow Methods
  activate(): void {
    const current = this.state.value;
    this.state.next({
      ...current,
      active: true,
      timestamp: Date.now()
    });
  }

  deactivate(): void {
    const current = this.state.value;
    this.state.next({
      ...current,
      active: false,
      timestamp: Date.now()
    });
  }

  // State Management
  updateState(changes: Partial<FlowState>): void {
    const current = this.state.value;
    this.state.next({
      ...current,
      ...changes,
      timestamp: Date.now()
    });
  }

  // Pattern Management
  addPattern(pattern: FlowPattern): void {
    this.patterns.set(pattern.id, new BehaviorSubject(pattern));
  }

  updatePattern(id: string, changes: Partial<FlowPattern>): void {
    const pattern = this.patterns.get(id);
    if (pattern) {
      pattern.next({
        ...pattern.value,
        ...changes
      });
    }
  }

  removePattern(id: string): void {
    this.patterns.delete(id);
  }

  // Connection Management
  addConnection(connection: Connection): void {
    const current = this.connections.value;
    this.connections.next([...current, connection]);
  }

  removeConnection(from: string, to: string): void {
    const current = this.connections.value;
    this.connections.next(
      current.filter(c => !(c.from === from && c.to === to))
    );
  }

  // Observation Methods
  observeState(): Observable<FlowState> {
    return this.state.asObservable();
  }

  observePattern(id: string): Observable<FlowPattern | undefined> {
    const pattern = this.patterns.get(id);
    return pattern ? pattern.asObservable() : new Observable();
  }

  observePatterns(): Observable<FlowPattern[]> {
    return new Observable(subscriber => {
      const patterns = Array.from(this.patterns.values()).map(p => p.value);
      subscriber.next(patterns);
    });
  }

  observeConnections(): Observable<Connection[]> {
    return this.connections.asObservable();
  }

  // Flow Metrics
  getDepth(): number {
    return this.state.value.energy * this.state.value.harmony;
  }

  getHarmony(): number {
    return this.state.value.harmony;
  }

  getEnergy(): number {
    return this.state.value.energy;
  }

  // System State
  isActive(): boolean {
    return this.state.value.active;
  }

  isHarmonious(): boolean {
    return this.state.value.harmony >= 0.7;
  }

  isDeep(): boolean {
    return this.getDepth() >= 0.7;
  }

  // Cleanup
  destroy(): void {
    this.state.complete();
    this.connections.complete();
    this.patterns.forEach(pattern => pattern.complete());
  }
} 