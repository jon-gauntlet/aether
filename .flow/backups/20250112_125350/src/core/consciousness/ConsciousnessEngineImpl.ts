import { BehaviorSubject, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import {
  ConsciousnessState,
  NaturalFlow,
  EnergyState,
  FlowSpace,
  Connection,
  isCoherent,
  isProtected,
  isFlowing
} from '../types/consciousness';

export class ConsciousnessEngineImpl {
  private state: BehaviorSubject<ConsciousnessState>;
  private spaces: Map<string, BehaviorSubject<FlowSpace>>;

  constructor(meta: ConsciousnessState['meta']) {
    this.spaces = new Map();
    this.state = new BehaviorSubject<ConsciousnessState>(this.createInitialState(meta));
    this.initializeNaturalProcesses();
  }

  private createInitialState(meta: ConsciousnessState['meta']): ConsciousnessState {
    return {
      flow: {
        rhythm: 1,
        resonance: 1,
        coherence: 1,
        presence: 1
      },
      energy: {
        level: 1,
        quality: 1,
        stability: 1,
        protection: 1
      },
      spaces: [],
      meta
    };
  }

  private initializeNaturalProcesses(): void {
    // Core protection cycles
    setInterval(() => this.maintainCoherence(), 100);
    setInterval(() => this.protectEnergy(), 150);
    setInterval(() => this.purifyFlow(), 200);
  }

  // Natural Space Operations
  createSpace(type: FlowSpace['type']): string {
    const id = crypto.randomUUID();
    const space: FlowSpace = {
      id,
      type,
      flow: { rhythm: 1, resonance: 1, coherence: 1, presence: 1 },
      depth: 1,
      connections: []
    };
    
    this.spaces.set(id, new BehaviorSubject(space));
    const currentState = this.state.value;
    this.state.next({
      ...currentState,
      spaces: [...currentState.spaces, space]
    });
    
    return id;
  }

  connectSpaces(sourceId: string, targetId: string): void {
    const connection: Connection = {
      source: sourceId,
      target: targetId,
      strength: 1,
      type: 'resonance'
    };

    const sourceSpace = this.spaces.get(sourceId)?.value;
    const targetSpace = this.spaces.get(targetId)?.value;

    if (sourceSpace && targetSpace) {
      this.spaces.get(sourceId)?.next({
        ...sourceSpace,
        connections: [...sourceSpace.connections, connection]
      });
      
      this.spaces.get(targetId)?.next({
        ...targetSpace,
        connections: [...targetSpace.connections, connection]
      });
    }
  }

  deepenSpace(id: string): void {
    const space = this.spaces.get(id)?.value;
    if (space) {
      this.spaces.get(id)?.next({
        ...space,
        depth: Math.min(space.depth + 0.1, 1)
      });
    }
  }

  // Protection Systems
  maintainCoherence(): void {
    const currentState = this.state.value;
    if (!isCoherent(currentState.flow)) {
      this.state.next({
        ...currentState,
        flow: {
          ...currentState.flow,
          coherence: Math.min(currentState.flow.coherence + 0.1, 1),
          presence: Math.min(currentState.flow.presence + 0.1, 1)
        }
      });
    }
  }

  protectEnergy(): void {
    const currentState = this.state.value;
    if (!isProtected(currentState.energy)) {
      this.state.next({
        ...currentState,
        energy: {
          ...currentState.energy,
          protection: Math.min(currentState.energy.protection + 0.1, 1),
          stability: Math.min(currentState.energy.stability + 0.1, 1)
        }
      });
    }
  }

  purifyFlow(): void {
    const currentState = this.state.value;
    currentState.spaces.forEach(space => {
      if (!isFlowing(space)) {
        const updatedSpace = {
          ...space,
          flow: {
            ...space.flow,
            rhythm: Math.min(space.flow.rhythm + 0.1, 1),
            resonance: Math.min(space.flow.resonance + 0.1, 1)
          }
        };
        this.spaces.get(space.id)?.next(updatedSpace);
      }
    });
  }

  // Observation Systems
  observeFlow(): Observable<NaturalFlow> {
    return this.state.pipe(map(state => state.flow));
  }

  observeEnergy(): Observable<EnergyState> {
    return this.state.pipe(map(state => state.energy));
  }

  observeSpace(id: string): Observable<FlowSpace> {
    return this.spaces.get(id)?.asObservable() || 
           new Observable<FlowSpace>();
  }
} 