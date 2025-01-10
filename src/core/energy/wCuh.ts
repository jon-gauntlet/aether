import { Observable, BehaviorSubject, combineLatest, throwError } from 'rxjs';
import { map, distinctUntilChanged, debounceTime, catchError } from 'rxjs/operators';
import {
  Field,
  FlowState,
  NaturalFlow,
  FlowMetrics,
  Resonance,
  Protection,
  createDefaultField
} from '../types/base';

import {
  ConsciousnessState,
  FlowSpace
} from '../types/consciousness';

import {
  EnergyState
} from '../types/energy';

import {
  MindSpace
} from '../types/space';

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

          // Ensure we have valid states
          const currentFlow = createNaturalFlow(flow);
          const currentEnergy = energy;
          const spaces = mindSpaces;

          // Create a base flow state for calculations
          const baseFlow: FlowState = {
            presence: flow.presence,
            harmony: flow.harmony,
            rhythm: flow.rhythm,
            resonance: flow.resonance,
            coherence: flow.coherence
          };

          const mainSpace: MindSpace = spaces[0] || {
            id: 'root',
            resonance: {
              frequency: this.calculateSystemFrequency(baseFlow, currentEnergy),
              amplitude: 1,
              harmony: this.calculateSystemStability(baseFlow, currentEnergy),
              field: this.createField(baseFlow, currentEnergy),
              essence: this.calculateSystemStability(baseFlow, currentEnergy)
            },
            depth: this.calculateSystemDepth(baseFlow, currentEnergy),
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
            depth: this.calculateSystemDepth(baseFlow, currentEnergy),
            protection: {
              strength: this.calculateSystemResilience(baseFlow, currentEnergy),
              level: this.calculateSystemStability(baseFlow, currentEnergy),
              field: mainSpace.resonance.field,
              resilience: this.calculateSystemResilience(baseFlow, currentEnergy),
              adaptability: this.calculateSystemStability(baseFlow, currentEnergy)
            },
            energy: currentEnergy,
            flow: currentFlow,
            coherence: this.calculateSystemCoherence(currentFlow, currentEnergy),
            timestamp: Date.now()
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
        metrics: flowState,
        flow: createNaturalFlow(flowState),
        depth: mindSpace.depth,
        resonance: mindSpace.resonance,
        protection: {
          strength: mindSpace.resonance.harmony,
          level: mindSpace.resonance.amplitude,
          resilience: mindSpace.resonance.essence,
          adaptability: mindSpace.resonance.harmony,
          field: mindSpace.resonance.field
        },
        connections: mindSpace.connections
      };
    });
  }

  private calculateSystemFrequency(flow: FlowState, energy: EnergyState): number {
    return (flow.rhythm * energy.level) / 2;
  }

  private calculateSystemStability(flow: FlowState, energy: EnergyState): number {
    return (flow.harmony * energy.stability) / 2;
  }

  private calculateSystemResilience(flow: FlowState, energy: EnergyState): number {
    return (flow.presence * energy.protection) / 2;
  }

  private calculateSystemDepth(flow: FlowState, energy: EnergyState): number {
    return (flow.coherence * energy.quality) / 2;
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
    const nextEnergy: EnergyState = {
      level: this.calculateNextValue(current.level, target.level),
      capacity: this.calculateNextValue(current.capacity, target.capacity),
      quality: this.calculateNextValue(current.quality, target.quality),
      stability: this.calculateNextValue(current.stability, target.stability),
      protection: this.calculateNextValue(current.protection, target.protection),
      resonance: target.resonance || current.resonance,
      field: target.field || current.field,
      flow: this.calculateNextValue(current.flow, target.flow),
      recovery: this.calculateNextValue(current.recovery, target.recovery),
      timestamp: Date.now()
    };

    this.stateManager.updateEnergy(nextEnergy);
  }

  private convertFlowSpaceToMindSpace(space: FlowSpace | undefined): MindSpace {
    if (!space) {
      return {
        id: 'default',
        type: 'meditation',
        metrics: {
          presence: 1,
          harmony: 1,
          rhythm: 1,
          resonance: 1,
          coherence: 1
        },
        resonance: {
          frequency: 1,
          amplitude: 1,
          harmony: 1,
          field: createDefaultField(),
          essence: 1
        },
        depth: 1,
        protection: {
          strength: 1,
          level: 1,
          resilience: 1,
          adaptability: 1,
          field: createDefaultField()
        },
        flow: createEmptyNaturalFlow(),
        connections: [],
        timestamp: Date.now()
      };
    }

    return {
      id: space.id,
      type: space.type,
      metrics: space.metrics,
      resonance: space.resonance,
      depth: space.depth,
      protection: space.protection,
      flow: space.flow,
      connections: space.connections,
      timestamp: space.timestamp || Date.now()
    };
  }

  private async evolveSpace(
    currentSpace: FlowSpace | undefined,
    targetSpace: FlowSpace | undefined
  ): Promise<void> {
    const current = this.convertFlowSpaceToMindSpace(currentSpace);
    const target = this.convertFlowSpaceToMindSpace(targetSpace);
    
    const nextSpace: MindSpace = {
      id: current.id,
      type: current.type,
      metrics: {
        presence: this.calculateNextValue(current.metrics.presence, target.metrics.presence),
        harmony: this.calculateNextValue(current.metrics.harmony, target.metrics.harmony),
        rhythm: this.calculateNextValue(current.metrics.rhythm, target.metrics.rhythm),
        resonance: this.calculateNextValue(current.metrics.resonance, target.metrics.resonance),
        coherence: this.calculateNextValue(current.metrics.coherence, target.metrics.coherence)
      },
      resonance: {
        frequency: this.calculateNextValue(current.resonance.frequency, target.resonance.frequency),
        amplitude: this.calculateNextValue(current.resonance.amplitude, target.resonance.amplitude),
        harmony: this.calculateNextValue(current.resonance.harmony, target.resonance.harmony),
        essence: this.calculateNextValue(current.resonance.essence, target.resonance.essence),
        field: this.calculateNextField(current.resonance.field, target.resonance.field)
      },
      depth: this.calculateNextValue(current.depth, target.depth),
      protection: {
        strength: this.calculateNextValue(current.protection.strength, target.protection.strength),
        level: this.calculateNextValue(current.protection.level, target.protection.level),
        resilience: this.calculateNextValue(current.protection.resilience, target.protection.resilience),
        adaptability: this.calculateNextValue(current.protection.adaptability, target.protection.adaptability),
        field: this.calculateNextField(current.protection.field, target.protection.field)
      },
      flow: createNaturalFlow({
        presence: this.calculateNextValue(current.metrics.presence, target.metrics.presence),
        harmony: this.calculateNextValue(current.metrics.harmony, target.metrics.harmony),
        rhythm: this.calculateNextValue(current.metrics.rhythm, target.metrics.rhythm),
        resonance: this.calculateNextValue(current.metrics.resonance, target.metrics.resonance),
        coherence: this.calculateNextValue(current.metrics.coherence, target.metrics.coherence)
      }),
      connections: current.connections,
      timestamp: Date.now()
    };

    this.stateManager.updateSpace(nextSpace.id, nextSpace);
  }

  private calculateNextValue(current: number, target?: number): number {
    if (target === undefined) return current;
    return current + (target - current) * 0.1;
  }

  private calculateNextField(current: Field | undefined, target: Field | undefined): Field {
    if (!current || !target) return createDefaultField();
    
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

  private async evolveState(): Promise<ConsciousnessState> {
    // Get current states with null checks
    const flow = await this.stateManager.observeFlow().pipe(
      map(flowState => createNaturalFlow(flowState))
    ).toPromise();

    const energy = await this.stateManager.observeEnergy().toPromise();
    const spaces = await this.stateManager.observeSpaces().toPromise();

    if (!flow || !energy || !spaces || !Array.isArray(spaces)) {
      throw new SystemIntegrationError('Failed to evolve state: missing required states');
    }

    // Create base flow state for calculations
    const baseFlow: FlowState = {
      presence: flow.presence,
      harmony: flow.harmony,
      rhythm: flow.rhythm,
      resonance: flow.resonance,
      coherence: flow.coherence
    };

    // Ensure we have at least one space
    const mainSpace = spaces[0] || {
      id: 'root',
      resonance: {
        frequency: this.calculateSystemFrequency(baseFlow, energy),
        amplitude: 1,
        harmony: this.calculateSystemStability(baseFlow, energy),
        field: this.createField(baseFlow, energy),
        essence: this.calculateSystemStability(baseFlow, energy)
      },
      depth: this.calculateSystemDepth(baseFlow, energy),
      connections: []
    };

    return {
      id: 'system',
      type: 'individual',
      space: mainSpace,
      spaces: this.convertToFlowSpaces(spaces),
      resonance: {
        frequency: this.calculateSystemFrequency(baseFlow, energy),
        amplitude: this.calculateSystemStability(baseFlow, energy),
        harmony: this.calculateSystemResilience(baseFlow, energy),
        field: this.createField(baseFlow, energy),
        essence: this.calculateSystemDepth(baseFlow, energy)
      },
      depth: this.calculateSystemDepth(baseFlow, energy),
      protection: {
        strength: energy.protection,
        level: energy.quality,
        field: this.createField(baseFlow, energy),
        resilience: this.calculateSystemResilience(baseFlow, energy),
        adaptability: this.calculateSystemStability(baseFlow, energy)
      },
      energy,
      flow,
      coherence: this.calculateSystemCoherence(flow, energy),
      timestamp: Date.now()
    };
  }

  private createSystemState(
    mainSpace: MindSpace,
    spaces: FlowSpace[],
    currentEnergy: EnergyState,
    currentFlow: NaturalFlow
  ): ConsciousnessState {
    return {
      id: 'system',
      type: 'individual',
      space: mainSpace,
      spaces,
      resonance: {
        frequency: this.calculateSystemFrequency(currentFlow, currentEnergy),
        amplitude: this.calculateSystemAmplitude(currentFlow, currentEnergy),
        harmony: this.calculateSystemHarmony(currentFlow, currentEnergy),
        field: this.createField(currentFlow, currentEnergy),
        essence: this.calculateSystemEssence(currentFlow, currentEnergy)
      },
      depth: this.calculateSystemDepth(currentFlow, currentEnergy),
      protection: {
        strength: this.calculateSystemResilience(currentFlow, currentEnergy),
        level: this.calculateSystemStability(currentFlow, currentEnergy),
        field: mainSpace.resonance.field,
        resilience: this.calculateSystemResilience(currentFlow, currentEnergy),
        adaptability: this.calculateSystemStability(currentFlow, currentEnergy)
      },
      energy: currentEnergy,
      flow: currentFlow,
      coherence: this.calculateSystemCoherence(currentFlow, currentEnergy),
      timestamp: Date.now()
    };
  }

  private calculateSystemAmplitude(flow: FlowState, energy: EnergyState): number {
    return (flow.resonance * 0.6 + energy.resonance.amplitude * 0.4);
  }

  private calculateSystemHarmony(flow: FlowState, energy: EnergyState): number {
    return (flow.harmony * 0.7 + energy.resonance.harmony * 0.3);
  }

  private calculateSystemEssence(flow: FlowState, energy: EnergyState): number {
    return (flow.coherence * 0.8 + energy.resonance.essence * 0.2);
  }

  private calculateSystemCoherence(flow: FlowState, energy: EnergyState): number {
    return (flow.coherence * 0.7 + energy.resonance.harmony * 0.3);
  }
}