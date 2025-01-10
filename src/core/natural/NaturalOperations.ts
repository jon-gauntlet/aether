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

export class NaturalOperations {
  constructor(
    private updateFlow: (flow: Partial<NaturalFlow>) => void,
    private updateEnergy: (energy: Partial<EnergyState>) => void,
    private updateSpace: (id: string, space: Partial<FlowSpace>) => void,
    private createSpace: (type: FlowSpace['type']) => string,
    private connectSpaces: (source: string, target: string) => void
  ) {}

  // Flow Operations
  async deepenFlow(flow: NaturalFlow): Promise<void> {
    this.updateFlow({
      coherence: Math.min(flow.coherence + 0.1, 1),
      presence: Math.min(flow.presence + 0.1, 1)
    });
  }

  async strengthenFlow(flow: NaturalFlow): Promise<void> {
    this.updateFlow({
      rhythm: Math.min(flow.rhythm + 0.1, 1),
      resonance: Math.min(flow.resonance + 0.1, 1)
    });
  }

  // Energy Operations
  async raiseEnergy(energy: EnergyState): Promise<void> {
    this.updateEnergy({
      level: Math.min(energy.level + 0.1, 1),
      quality: Math.min(energy.quality + 0.05, 1)
    });
  }

  async protectEnergy(energy: EnergyState): Promise<void> {
    this.updateEnergy({
      protection: Math.min(energy.protection + 0.1, 1),
      stability: Math.min(energy.stability + 0.1, 1)
    });
  }

  // Space Operations
  async createFlowSpace(
    type: FlowSpace['type'],
    initialFlow?: Partial<NaturalFlow>
  ): Promise<string> {
    const id = this.createSpace(type);
    
    if (initialFlow) {
      this.updateSpace(id, {
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

  async deepenSpace(id: string, space: FlowSpace): Promise<void> {
    this.updateSpace(id, {
      depth: Math.min(space.depth + 0.1, 1),
      flow: {
        ...space.flow,
        coherence: Math.min(space.flow.coherence + 0.1, 1),
        presence: Math.min(space.flow.presence + 0.1, 1)
      }
    });
  }

  async connectFlowSpaces(
    sourceId: string,
    targetId: string,
    sourceSpace: FlowSpace,
    targetSpace: FlowSpace
  ): Promise<void> {
    // Only connect if both spaces are flowing
    if (isFlowing(sourceSpace) && isFlowing(targetSpace)) {
      this.connectSpaces(sourceId, targetId);
      
      // Harmonize the flows
      const harmonizedFlow = {
        rhythm: (sourceSpace.flow.rhythm + targetSpace.flow.rhythm) / 2,
        resonance: (sourceSpace.flow.resonance + targetSpace.flow.resonance) / 2,
        coherence: Math.min(sourceSpace.flow.coherence + 0.1, 1),
        presence: Math.min(sourceSpace.flow.presence + 0.1, 1)
      };

      this.updateSpace(sourceId, { flow: harmonizedFlow });
      this.updateSpace(targetId, { flow: harmonizedFlow });
    }
  }

  // System Operations
  async maintainSystemHealth(state: ConsciousnessState): Promise<void> {
    // Maintain flow coherence
    if (!isCoherent(state.flow)) {
      await this.deepenFlow(state.flow);
    }

    // Protect energy
    if (!isProtected(state.energy)) {
      await this.protectEnergy(state.energy);
    }

    // Maintain space flows
    for (const space of state.spaces) {
      if (!isFlowing(space)) {
        await this.deepenSpace(space.id, space);
      }
    }
  }

  // Pure Functions
  static calculateOperationTiming(
    flow: NaturalFlow,
    energy: EnergyState
  ): number {
    const flowTiming = (
      flow.rhythm * 0.4 +
      flow.resonance * 0.3 +
      flow.presence * 0.3
    );

    const energyTiming = (
      energy.quality * 0.4 +
      energy.stability * 0.3 +
      energy.protection * 0.3
    );

    return (flowTiming * 0.6 + energyTiming * 0.4) * 100;
  }

  static calculateOperationStrength(
    flow: NaturalFlow,
    energy: EnergyState
  ): number {
    const flowStrength = (
      flow.coherence * 0.4 +
      flow.resonance * 0.3 +
      flow.presence * 0.3
    );

    const energyStrength = (
      energy.level * 0.4 +
      energy.quality * 0.3 +
      energy.protection * 0.3
    );

    return flowStrength * 0.6 + energyStrength * 0.4;
  }
} 