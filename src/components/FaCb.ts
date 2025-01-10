import { Observable, BehaviorSubject } from 'rxjs';
import { map, mergeMap, filter } from 'rxjs/operators';

interface SystemState {
  energy: number;
  depth: number;
  connections: Map<string, number>;
  flowPatterns: Set<string>;
}

interface ComponentFlow {
  id: string;
  energy: number;
  depth: number;
  connections: string[];
}

export class NaturalIntegration {
  private systemState: BehaviorSubject<SystemState>;
  private componentFlows: Map<string, Observable<ComponentFlow>>;
  
  constructor() {
    this.systemState = new BehaviorSubject<SystemState>({
      energy: 1,
      depth: 0,
      connections: new Map(),
      flowPatterns: new Set()
    });
    
    this.componentFlows = new Map();
  }

  // Components naturally join the system
  integrateComponent(id: string, flow$: Observable<ComponentFlow>) {
    this.componentFlows.set(id, flow$);
    
    // Let the component's energy naturally affect the system
    flow$.pipe(
      map(flow => this.naturallyAdapt(flow))
    ).subscribe(newState => {
      this.systemState.next(newState);
    });
  }

  // System naturally adapts to new flows
  private naturallyAdapt(flow: ComponentFlow): SystemState {
    const currentState = this.systemState.value;
    
    // Energy naturally distributes
    const newEnergy = (currentState.energy + flow.energy) / 2;
    
    // Depth naturally forms
    const newDepth = Math.max(currentState.depth, flow.depth);
    
    // Connections naturally strengthen
    const newConnections = new Map(currentState.connections);
    flow.connections.forEach(conn => {
      const strength = newConnections.get(conn) || 0;
      newConnections.set(conn, strength + 0.1);
    });

    // Patterns naturally emerge
    const newPatterns = new Set(currentState.flowPatterns);
    if (flow.energy > currentState.energy) {
      newPatterns.add('high_energy_flow');
    }
    if (flow.depth > currentState.depth) {
      newPatterns.add('deep_work_pattern');
    }

    return {
      energy: newEnergy,
      depth: newDepth,
      connections: newConnections,
      flowPatterns: newPatterns
    };
  }

  // Observe how the system naturally flows
  observeSystemFlow(): Observable<SystemState> {
    return this.systemState.asObservable();
  }

  // Components can naturally discover each other
  discoverConnections(componentId: string): string[] {
    const state = this.systemState.value;
    return Array.from(state.connections.entries())
      .filter(([_, strength]) => strength > 0.5)
      .map(([id]) => id);
  }

  // System naturally balances itself
  private balanceSystem() {
    const state = this.systemState.value;
    
    // Energy naturally stabilizes
    if (state.energy > 2) {
      state.energy = Math.sqrt(state.energy);
    }
    
    // Depth naturally preserves
    if (state.depth > 0) {
      state.connections.forEach((strength, id) => {
        if (strength < 0.3) {
          state.connections.delete(id);
        }
      });
    }
    
    this.systemState.next(state);
  }
}

// Example usage:
/*
const system = new NaturalIntegration();

// Components naturally flow into the system
system.integrateComponent('chat', chatFlow$);
system.integrateComponent('focus', focusFlow$);

// System naturally evolves
system.observeSystemFlow().subscribe(state => {
  console.log('System naturally evolved:', state);
});
*/ 