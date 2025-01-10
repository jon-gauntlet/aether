import { Observable, combineLatest } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { FlowEngine, FlowPattern, FlowType } from '../flow/FlowEngine';
import { SpaceEngine, SpacePattern, SpaceType } from '../space/SpaceEngine';
import { EnergyEngine, EnergyPattern, EnergyType } from '../energy/EnergyEngine';
import { Field, Resonance } from '../types/consciousness';

export interface EnergizedState {
  flows: FlowPattern[];
  spaces: SpacePattern[];
  energies: EnergyPattern[];
  systemEnergy: number;
  resonance: Resonance;
  field: Field;
}

export class EnergyIntegration {
  constructor(
    private flowEngine: FlowEngine,
    private spaceEngine: SpaceEngine,
    private energyEngine: EnergyEngine
  ) {}

  public observe(): Observable<EnergizedState> {
    return combineLatest([
      this.flowEngine.observe({}),
      this.spaceEngine.observe(),
      this.energyEngine.observe(),
      this.energyEngine.observeSystemEnergy(),
      this.flowEngine.observeResonance(),
      this.spaceEngine.observeResonance()
    ]).pipe(
      debounceTime(100), // Natural rhythm
      map(([flows, spaces, energies, systemEnergy, flowRes, spaceRes]) => ({
        flows,
        spaces,
        energies,
        systemEnergy,
        resonance: this.combineResonance(flowRes, spaceRes),
        field: this.combineFields(flowRes.field, spaceRes.field)
      }))
    );
  }

  public async energizeFlow(
    flowId: string,
    type: EnergyType = 'vital'
  ): Promise<EnergyPattern> {
    // Create energy pattern
    const energy = await this.energyEngine.create(type);
    
    // Naturally connect it to flow
    const flow = await this.flowEngine.adjust(flowId, {
      energy: energy.state.level,
      resonance: energy.state.resonance
    });

    // Begin energy flow
    await this.energyEngine.flow(energy.id, flowId, energy.state.level * 0.5);
    
    return energy;
  }

  public async energizeSpace(
    spaceId: string,
    type: EnergyType = 'protective'
  ): Promise<EnergyPattern> {
    // Create energy pattern
    const energy = await this.energyEngine.create(type);
    
    // Naturally connect it to space
    const space = await this.spaceEngine.adapt(spaceId, {
      resonance: energy.state.resonance,
      protection: energy.state.protection
    });

    // Begin energy radiation
    await this.energyEngine.radiate(energy.id, space.field.radius);
    
    return energy;
  }

  public async deepenEnergy(
    flowId: string,
    spaceId: string,
    energyId: string
  ): Promise<void> {
    // Still the energy
    await this.energyEngine.still(energyId);
    
    // Deepen the containing space
    await this.spaceEngine.adapt(spaceId, {
      depth: 'deep',
      protection: {
        strength: 0.8,
        resilience: 0.7,
        adaptability: 0.4
      }
    });

    // Deepen the flow
    await this.flowEngine.adjust(flowId, {
      depth: 'deep',
      protection: {
        strength: 0.8,
        resilience: 0.7,
        adaptability: 0.4
      }
    });
  }

  public async transformEnergy(
    sourceId: string,
    targetId: string,
    type: EnergyType = 'transformative'
  ): Promise<boolean> {
    // Create transformation energy
    const transformer = await this.energyEngine.create(type, 0.3);
    
    // Flow energy through transformer
    await this.energyEngine.flow(sourceId, transformer.id, 0.5);
    const success = await this.energyEngine.flow(transformer.id, targetId, 0.3);
    
    // Complete transformation
    await this.energyEngine.adjust(transformer.id, {
      mode: 'radiating',
      level: 0
    });
    
    return success;
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
    const center = {
      x: (flowField.center.x + spaceField.center.x) / 2,
      y: (flowField.center.y + spaceField.center.y) / 2,
      z: (flowField.center.z + spaceField.center.z) / 2
    };

    const radius = Math.max(flowField.radius, spaceField.radius);
    const strength = (flowField.strength + spaceField.strength) / 2;

    const waves = [...flowField.waves, ...spaceField.waves]
      .sort((a, b) => b.amplitude - a.amplitude)
      .slice(0, 5);

    return { center, radius, strength, waves };
  }
} 