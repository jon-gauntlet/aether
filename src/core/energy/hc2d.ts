import {
  ConsciousnessState,
  NaturalFlow,
  EnergyState,
  FlowSpace,
  Connection
} from '../types/consciousness';

/**
 * SystemOperations provides high-level operations for system state transitions,
 * ensuring smooth evolution and maintaining system integrity.
 */
export class SystemOperations {
  constructor(
    private readonly stateManager: {
      updateFlow: (flow: Partial<NaturalFlow>) => void;
      updateEnergy: (energy: Partial<EnergyState>) => void;
      updateSpace: (id: string, space: Partial<FlowSpace>) => void;
      createSpace: (type: FlowSpace['type']) => string;
      connectSpaces: (source: string, target: string) => void;
    }
  ) {}

  // Flow Management
  async enhanceFlow(flow: NaturalFlow): Promise<void> {
    this.stateManager.updateFlow({
      coherence: Math.min(flow.coherence + 0.1, 1),
      presence: Math.min(flow.presence + 0.1, 1)
    });
  }

  async stabilizeFlow(flow: NaturalFlow): Promise<void> {
    this.stateManager.updateFlow({
      rhythm: Math.min(flow.rhythm + 0.1, 1),
      resonance: Math.min(flow.resonance + 0.1, 1)
    });
  }

  // Energy Management
  async enhanceEnergy(energy: EnergyState): Promise<void> {
    this.stateManager.updateEnergy({
      level: Math.min(energy.level + 0.1, 1),
      quality: Math.min(energy.quality + 0.05, 1)
    });
  }

  async stabilizeEnergy(energy: EnergyState): Promise<void> {
    this.stateManager.updateEnergy({
      stability: Math.min(energy.stability + 0.1, 1),
      protection: Math.min(energy.protection + 0.1, 1)
    });
  }

  // Space Management
  async createStructuredSpace(
    type: FlowSpace['type'],
    initialFlow?: Partial<NaturalFlow>
  ): Promise<string> {
    const id = this.stateManager.createSpace(type);
    
    if (initialFlow) {
      this.stateManager.updateSpace(id, {
        flow: {
          rhythm: 1,
          resonance: 1,
          coherence: 1,
          presence: 1,
          ...initialFlow
        }
      });
    }
    
    return id;
  }

  async enhanceSpace(id: string, space: FlowSpace): Promise<void> {
    this.stateManager.updateSpace(id, {
      depth: Math.min(space.depth + 0.1, 1),
      flow: {
        ...space.flow,
        coherence: Math.min(space.flow.coherence + 0.1, 1),
        presence: Math.min(space.flow.presence + 0.1, 1)
      }
    });
  }

  async connectStructures(
    sourceId: string,
    targetId: string,
    sourceSpace: FlowSpace,
    targetSpace: FlowSpace
  ): Promise<void> {
    const canConnect = this.validateConnection(sourceSpace, targetSpace);
    
    if (canConnect) {
      this.stateManager.connectSpaces(sourceId, targetId);
      
      const harmonizedFlow = this.calculateHarmonizedFlow(
        sourceSpace.flow,
        targetSpace.flow
      );

      this.stateManager.updateSpace(sourceId, { flow: harmonizedFlow });
      this.stateManager.updateSpace(targetId, { flow: harmonizedFlow });
    }
  }

  // System Management
  async maintainSystemIntegrity(state: ConsciousnessState): Promise<void> {
    // Enhance flow stability
    if (this.needsFlowEnhancement(state.flow)) {
      await this.enhanceFlow(state.flow);
    }

    // Maintain energy stability
    if (this.needsEnergyStabilization(state.energy)) {
      await this.stabilizeEnergy(state.energy);
    }

    // Enhance space coherence
    for (const space of state.spaces) {
      if (this.needsSpaceEnhancement(space)) {
        await this.enhanceSpace(space.id, space);
      }
    }
  }

  // Validation Functions
  private validateConnection(
    source: FlowSpace,
    target: FlowSpace
  ): boolean {
    const sourceQuality = this.calculateSpaceQuality(source);
    const targetQuality = this.calculateSpaceQuality(target);
    return sourceQuality > 0.5 && targetQuality > 0.5;
  }

  private needsFlowEnhancement(flow: NaturalFlow): boolean {
    return flow.coherence < 0.7 || flow.presence < 0.5;
  }

  private needsEnergyStabilization(energy: EnergyState): boolean {
    return energy.stability < 0.6 || energy.protection < 0.8;
  }

  private needsSpaceEnhancement(space: FlowSpace): boolean {
    return (
      space.flow.rhythm < 0.5 ||
      space.flow.resonance < 0.6
    );
  }

  // Calculation Functions
  private calculateHarmonizedFlow(
    source: NaturalFlow,
    target: NaturalFlow
  ): NaturalFlow {
    return {
      rhythm: (source.rhythm + target.rhythm) / 2,
      resonance: (source.resonance + target.resonance) / 2,
      coherence: Math.min(
        (source.coherence + target.coherence) / 2 + 0.1,
        1
      ),
      presence: Math.min(
        (source.presence + target.presence) / 2 + 0.1,
        1
      )
    };
  }

  private calculateSpaceQuality(space: FlowSpace): number {
    return (
      space.flow.rhythm * 0.3 +
      space.flow.resonance * 0.3 +
      space.flow.coherence * 0.2 +
      space.flow.presence * 0.2
    );
  }
} 