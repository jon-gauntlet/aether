import { Observable, BehaviorSubject, combineLatest, throwError } from 'rxjs';
import { map, distinctUntilChanged, debounceTime, catchError } from 'rxjs/operators';
import { 
  ConsciousnessState, 
  MindSpace, 
  FlowSpace,
  Field,
  FlowState,
  EnergyState,
  NaturalFlow,
  FlowMetrics
} from '../types/consciousness';
import { createEmptyNaturalFlow, createNaturalFlow } from '../factories/flow';

class SystemIntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemIntegrationError';
  }
}

/**
 * SystemIntegration manages the natural evolution of system state,
 * maintaining harmony between different parts of consciousness.
 */
export class SystemIntegration {
  private flowEngine: NaturalFlow;
  private readonly errorSubject = new BehaviorSubject<Error | null>(null);

  constructor(
    private readonly stateManager: {
      observeFlow: () => Observable<FlowState>;
      observeEnergy: () => Observable<EnergyState>;
      observeSpaces: () => Observable<MindSpace[]>;
      updateSpace: (id: string, space: MindSpace) => void;
      updateFlow: (flow: FlowState) => void;
      updateEnergy: (energy: EnergyState) => void;
    }
  ) {
    this.flowEngine = createEmptyNaturalFlow();
  }

  private toFlowState(flow: NaturalFlow): FlowState {
    if (!flow) {
      throw new SystemIntegrationError('Cannot convert undefined flow to FlowState');
    }
    return {
      presence: flow.presence,
      harmony: flow.harmony,
      rhythm: flow.rhythm,
      resonance: flow.resonance,
      coherence: flow.coherence
    };
  }

  // System State Management
  observeSystemState(): Observable<ConsciousnessState> {
    if (!this.flowEngine) {
      throw new SystemIntegrationError('Flow engine not initialized');
    }

    return combineLatest([
      this.stateManager.observeFlow(),
      this.stateManager.observeEnergy(),
      this.stateManager.observeSpaces()
    ]).pipe(
      debounceTime(16), // Natural rhythm (60fps)
      map(([flow, energy, mindSpaces]) => {
        try {
          if (!flow || !energy || !mindSpaces || !Array.isArray(mindSpaces)) {
            throw new SystemIntegrationError('Invalid system state: missing flow, energy or spaces');
          }

          // Ensure we have valid flow state
          const currentFlow = this.toFlowState(this.flowEngine);
          const currentEnergy: EnergyState = energy;
          const spaces: MindSpace[] = mindSpaces;

          const mainSpace: MindSpace = spaces[0] || {
            id: 'root',
            resonance: {
              frequency: this.calculateSystemFrequency(flow, currentEnergy),
              amplitude: 1,
              harmony: this.calculateSystemStability(flow, currentEnergy),
              field: this.createField(flow, currentEnergy),
              essence: this.calculateSystemStability(flow, currentEnergy)
            },
            depth: this.calculateSystemDepth(flow, currentEnergy),
            connections: []
          };

          // Convert MindSpaces to FlowSpaces with proper NaturalFlow instances
          const flowSpaces: FlowSpace[] = this.convertToFlowSpaces(spaces);

          const systemState: ConsciousnessState = {
            id: 'root',
            type: 'individual' as const,
            space: mainSpace,
            spaces: flowSpaces,
            resonance: mainSpace.resonance,
            depth: this.calculateSystemDepth(flow, currentEnergy),
            protection: {
              strength: this.calculateSystemResilience(flow, currentEnergy),
              level: this.calculateSystemStability(flow, currentEnergy),
              field: mainSpace.resonance.field,
              resilience: this.calculateSystemResilience(flow, currentEnergy),
              adaptability: this.calculateSystemStability(flow, currentEnergy)
            },
            energy: currentEnergy,
            flow: this.flowEngine,
            connections: []
          };

          this.validateState(systemState);
          return systemState;

        } catch (error) {
          this.errorSubject.next(error instanceof Error ? error : new Error(String(error)));
          throw error;
        }
      }),
      distinctUntilChanged(),
      catchError(error => {
        console.error('System state observation error:', error);
        return throwError(() => error);
      })
    );
  }

  // Error handling
  observeErrors(): Observable<Error | null> {
    return this.errorSubject.asObservable();
  }

  private validateState(state: ConsciousnessState): void {
    if (!state.flow || typeof state.flow.observeDepth !== 'function') {
      throw new SystemIntegrationError('Invalid flow state: missing required methods');
    }
    if (!state.energy || typeof state.energy.level !== 'number') {
      throw new SystemIntegrationError('Invalid energy state: missing level');
    }
    if (!state.spaces || !Array.isArray(state.spaces)) {
      throw new SystemIntegrationError('Invalid spaces: must be an array');
    }
  }

  private createField(flow: FlowState, energy: EnergyState): Field {
    if (!flow || !energy) {
      throw new SystemIntegrationError('Cannot create field: missing flow or energy state');
    }
    return {
      center: { x: 0, y: 0, z: 0 },
      radius: Math.max(1, energy.level),
      strength: this.calculateSystemResilience(flow, energy),
      waves: []
    };
  }

  private convertToFlowSpaces(mindSpaces: MindSpace[]): FlowSpace[] {
    if (!mindSpaces || !Array.isArray(mindSpaces)) {
      throw new SystemIntegrationError('Cannot convert undefined or non-array mindSpaces');
    }
    return mindSpaces.map(mindSpace => {
      if (!mindSpace || !mindSpace.resonance) {
        throw new SystemIntegrationError('Invalid mindSpace: missing resonance');
      }
      const flowState: FlowState = {
        presence: mindSpace.resonance.harmony,
        harmony: mindSpace.resonance.harmony,
        rhythm: mindSpace.resonance.frequency,
        resonance: mindSpace.resonance.amplitude,
        coherence: mindSpace.resonance.essence
      };
      
      return {
        id: mindSpace.id,
        type: 'meditation',
        flow: createNaturalFlow(flowState),
        depth: mindSpace.depth,
        connections: mindSpace.connections
      };
    });
  }

  // System Evolution
  async evolveSystemState(
    currentState: ConsciousnessState,
    targetState: Partial<ConsciousnessState>
  ): Promise<void> {
    // Flow evolution
    if (targetState.flow) {
      await this.evolveFlow(currentState.flow, targetState.flow);
    }

    // Energy evolution
    if (targetState.energy) {
      await this.evolveEnergy(currentState.energy, targetState.energy);
    }

    // Space evolution
    if (targetState.space) {
      await this.evolveSpace(currentState.space, targetState.space);
    }
  }

  // Natural Transitions
  private async evolveFlow(
    current: FlowState,
    target: Partial<FlowState>
  ): Promise<void> {
    const nextFlow: FlowState = {
      rhythm: this.calculateNextValue(current.rhythm, target.rhythm),
      resonance: this.calculateNextValue(current.resonance, target.resonance),
      coherence: this.calculateNextValue(current.coherence, target.coherence),
      presence: this.calculateNextValue(current.presence, target.presence),
      harmony: this.calculateNextValue(current.harmony, target.harmony)
    };

    this.stateManager.updateFlow(nextFlow);
  }

  private async evolveEnergy(
    current: EnergyState,
    target: Partial<EnergyState>
  ): Promise<void> {
    const nextEnergy = {
      level: this.calculateNextValue(current.level, target.level),
      quality: this.calculateNextValue(current.quality, target.quality),
      stability: this.calculateNextValue(current.stability, target.stability),
      protection: this.calculateNextValue(current.protection, target.protection)
    };

    this.stateManager.updateEnergy(nextEnergy);
  }

  private async evolveSpace(
    currentSpace: MindSpace,
    targetSpace: MindSpace
  ): Promise<void> {
    const nextSpace: MindSpace = {
      id: currentSpace.id,
      resonance: {
        frequency: this.calculateNextValue(currentSpace.resonance.frequency, targetSpace.resonance.frequency),
        amplitude: this.calculateNextValue(currentSpace.resonance.amplitude, targetSpace.resonance.amplitude),
        harmony: this.calculateNextValue(currentSpace.resonance.harmony, targetSpace.resonance.harmony),
        essence: this.calculateNextValue(currentSpace.resonance.essence, targetSpace.resonance.essence),
        field: this.calculateNextField(currentSpace.resonance.field, targetSpace.resonance.field)
      },
      depth: this.calculateNextValue(currentSpace.depth, targetSpace.depth),
      connections: currentSpace.connections
    };

    this.stateManager.updateSpace(nextSpace.id, nextSpace);
  }

  private calculateNextValue(current: number, target?: number): number {
    if (target === undefined) return current;
    return current + (target - current) * 0.1;
  }

  private calculateNextField(current: Field, target?: Field): Field {
    if (!target) return current;
    return {
      center: {
        x: this.calculateNextValue(current.center.x, target.center.x),
        y: this.calculateNextValue(current.center.y, target.center.y),
        z: this.calculateNextValue(current.center.z, target.center.z)
      },
      radius: this.calculateNextValue(current.radius, target.radius),
      strength: this.calculateNextValue(current.strength, target.strength),
      waves: current.waves // Keep existing waves for now
    };
  }

  private calculateSystemDepth(
    flow: FlowState,
    energy: EnergyState
  ): number {
    return (
      flow.presence * 0.4 +
      flow.coherence * 0.3 +
      energy.quality * 0.3
    );
  }

  private calculateSystemFrequency(
    flow: FlowState,
    energy: EnergyState
  ): number {
    return (
      flow.rhythm * 0.4 +
      flow.resonance * 0.3 +
      energy.quality * 0.3
    );
  }

  private calculateSystemStability(
    flow: FlowState,
    energy: EnergyState
  ): number {
    return (
      flow.coherence * 0.4 +
      flow.presence * 0.3 +
      energy.stability * 0.3
    );
  }

  private calculateSystemResilience(
    flow: FlowState,
    energy: EnergyState
  ): number {
    return (
      energy.protection * 0.4 +
      energy.stability * 0.3 +
      flow.presence * 0.3
    );
  }

  private async evolveState(): Promise<ConsciousnessState> {
    const flow = await this.stateManager.observeFlow().pipe(
      map(flowState => createNaturalFlow(flowState))
    ).toPromise();

    const energy = await this.stateManager.observeEnergy().toPromise();
    const spaces = await this.stateManager.observeSpaces().toPromise();
    
    return {
      id: 'system',
      type: 'individual',
      space: spaces[0],
      spaces: this.convertToFlowSpaces(spaces),
      resonance: {
        frequency: this.calculateSystemFrequency(flow, energy),
        amplitude: this.calculateSystemStability(flow, energy),
        harmony: this.calculateSystemResilience(flow, energy),
        field: this.createField(flow, energy),
        essence: this.calculateSystemDepth(flow, energy)
      },
      depth: this.calculateSystemDepth(flow, energy),
      protection: {
        strength: energy.protection,
        level: energy.quality,
        field: this.createField(flow, energy),
        resilience: this.calculateSystemResilience(flow, energy),
        adaptability: this.calculateSystemStability(flow, energy)
      },
      energy,
      flow,
      connections: []
    };
  }
} 