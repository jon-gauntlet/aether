import { Observable, combineLatest } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';
import { FlowEngine, FlowPattern, FlowType } from '../flow/FlowEngine';
import { SpaceEngine, SpacePattern, SpaceType } from '../space/SpaceEngine';
import { Resonance, Field } from '../types/consciousness';

export interface IntegratedState {
  flows: FlowPattern[];
  spaces: SpacePattern[];
  resonance: Resonance;
  field: Field;
}

export class FlowSpaceIntegration {
  constructor(
    private flowEngine: FlowEngine,
    private spaceEngine: SpaceEngine
  ) {}

  public observe(): Observable<IntegratedState> {
    return combineLatest([
      this.flowEngine.observe({}),
      this.spaceEngine.observe(),
      this.flowEngine.observeResonance(),
      this.spaceEngine.observeResonance()
    ]).pipe(
      debounceTime(100), // Natural rhythm
      map(([flows, spaces, flowResonance, spaceResonance]) => ({
        flows,
        spaces,
        resonance: this.combineResonance(flowResonance, spaceResonance),
        field: this.combineFields(flowResonance.field, spaceResonance.field)
      }))
    );
  }

  public async createFlowSpace(
    flowType: FlowType,
    spaceType: SpaceType
  ): Promise<{ flow: FlowPattern; space: SpacePattern }> {
    // Create natural container first
    const space = await this.spaceEngine.create(spaceType);
    
    // Create flow within it
    const flow = await this.flowEngine.begin(flowType);
    
    // Natural integration
    await this.spaceEngine.enter(space.id, flow);
    
    return { flow, space };
  }

  public async moveFlow(
    flowId: string,
    fromSpaceId: string,
    toSpaceId: string
  ): Promise<boolean> {
    // Natural transition
    await this.spaceEngine.leave(fromSpaceId, flowId);
    return this.spaceEngine.enter(toSpaceId, { id: flowId } as FlowPattern);
  }

  public async connectSpaces(
    sourceId: string,
    targetId: string
  ): Promise<boolean> {
    return this.spaceEngine.connect(sourceId, targetId);
  }

  public async deepenFlow(
    flowId: string,
    spaceId: string
  ): Promise<void> {
    const flow = await this.flowEngine.adjust(flowId, {
      depth: 'deep',
      protection: {
        strength: 0.8,
        resilience: 0.7,
        adaptability: 0.4
      }
    });

    await this.spaceEngine.adapt(spaceId, {
      depth: 'deep',
      protection: {
        strength: 0.8,
        resilience: 0.7,
        adaptability: 0.4
      }
    });
  }

  public async dissolveFlow(
    flowId: string,
    spaceId: string
  ): Promise<void> {
    // Natural completion
    await this.spaceEngine.leave(spaceId, flowId);
    await this.flowEngine.end(flowId);
  }

  private combineResonance(flowRes: Resonance, spaceRes: Resonance): Resonance {
    return {
      frequency: (flowRes.frequency + spaceRes.frequency) / 2,
      amplitude: (flowRes.amplitude + spaceRes.amplitude) / 2,
      harmony: (flowRes.harmony + spaceRes.harmony) / 2,
      field: this.combineFields(flowRes.field, spaceRes.field)
    };
  }

  private combineFields(flowField: Field, spaceField: Field): Field {
    // Natural field combination
    const center = {
      x: (flowField.center.x + spaceField.center.x) / 2,
      y: (flowField.center.y + spaceField.center.y) / 2,
      z: (flowField.center.z + spaceField.center.z) / 2
    };

    const radius = Math.max(flowField.radius, spaceField.radius);
    const strength = (flowField.strength + spaceField.strength) / 2;

    // Combine and harmonize waves
    const waves = [...flowField.waves, ...spaceField.waves]
      .sort((a, b) => b.amplitude - a.amplitude)
      .slice(0, 5); // Keep strongest waves

    return { center, radius, strength, waves };
  }
} 