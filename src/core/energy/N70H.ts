import { Observable, combineLatest } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  ConsciousnessState,
  NaturalFlow,
  EnergyState,
  FlowSpace,
  MindSpace
} from '../types/consciousness';

/**
 * SystemIntegration manages the natural evolution of system state,
 * ensuring smooth transitions and maintaining system integrity.
 */
export class SystemIntegration {
  constructor(
    private readonly stateManager: {
      observeFlow: () => Observable<NaturalFlow>;
      observeEnergy: () => Observable<EnergyState>;
      observeSpaces: () => Observable<MindSpace[]>;
      updateSpace: (id: string, space: MindSpace) => void;
      updateFlow: (flow: NaturalFlow) => void;
      updateEnergy: (energy: EnergyState) => void;
    }
  ) {}

  // System State Management
  observeSystemState(): Observable<ConsciousnessState> {
    return combineLatest([
      this.stateManager.observeFlow(),
      this.stateManager.observeEnergy(),
      this.stateManager.observeSpaces()
    ]).pipe(
      debounceTime(16), // Natural rhythm (60fps)
      map(([flow, energy, mindSpaces]) => {
        const mainSpace: MindSpace = mindSpaces[0] || {
          id: 'root',
          resonance: {
            frequency: this.calculateSystemFrequency(flow, energy),
            amplitude: 1,
            harmony: this.calculateSystemStability(flow, energy),
            field: {
              center: { x: 0, y: 0, z: 0 },
              radius: 1,
              strength: this.calculateSystemResilience(flow, energy),
              waves: []
            },
            divine: this.calculateSystemStability(flow, energy)
          },
          depth: this.calculateSystemDepth(flow, energy),
          connections: []
        };

        // Convert MindSpaces to FlowSpaces
        const flowSpaces: FlowSpace[] = mindSpaces.map(mindSpace => ({
          id: mindSpace.id,
          type: 'flow',
          flow: {
            presence: mindSpace.resonance.harmony,
            harmony: mindSpace.resonance.harmony,
            rhythm: mindSpace.resonance.frequency,
            resonance: mindSpace.resonance.amplitude,
            coherence: mindSpace.resonance.harmony
          },
          depth: mindSpace.depth,
          connections: mindSpace.connections
        }));

        return {
          id: 'root',
          type: 'individual' as const,
          space: mainSpace,
          spaces: flowSpaces,
          resonance: mainSpace.resonance,
          depth: this.calculateSystemDepth(flow, energy),
          protection: {
            strength: this.calculateSystemResilience(flow, energy),
            level: this.calculateSystemStability(flow, energy),
            field: mainSpace.resonance.field,
            resilience: this.calculateSystemResilience(flow, energy),
            adaptability: this.calculateSystemStability(flow, energy)
          },
          energy,
          flow,
          connections: []
        };
      }),
      distinctUntilChanged()
    );
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
    current: NaturalFlow,
    target: Partial<NaturalFlow>
  ): Promise<void> {
    const nextFlow = {
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
        field: currentSpace.resonance.field,
        divine: this.calculateNextValue(currentSpace.resonance.divine, targetSpace.resonance.divine)
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

  private calculateSystemDepth(
    flow: NaturalFlow,
    energy: EnergyState
  ): number {
    return (
      flow.presence * 0.4 +
      flow.coherence * 0.3 +
      energy.quality * 0.3
    );
  }

  private calculateSystemFrequency(
    flow: NaturalFlow,
    energy: EnergyState
  ): number {
    return (
      flow.rhythm * 0.4 +
      flow.resonance * 0.3 +
      energy.quality * 0.3
    );
  }

  private calculateSystemStability(
    flow: NaturalFlow,
    energy: EnergyState
  ): number {
    return (
      flow.coherence * 0.4 +
      flow.presence * 0.3 +
      energy.stability * 0.3
    );
  }

  private calculateSystemResilience(
    flow: NaturalFlow,
    energy: EnergyState
  ): number {
    return (
      energy.protection * 0.4 +
      energy.stability * 0.3 +
      flow.presence * 0.3
    );
  }
} 