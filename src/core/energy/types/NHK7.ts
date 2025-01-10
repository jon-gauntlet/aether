import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';
import { Field, Protection, Resonance } from '../types/consciousness';

export type EnergyType = 'vital' | 'creative' | 'protective' | 'transformative';
export type EnergyState = 'potential' | 'flowing' | 'radiating' | 'still';

export interface EnergyPattern {
  id: string;
  type: EnergyType;
  state: {
    mode: EnergyState;
    level: number;        // 0-1 current energy level
    capacity: number;     // 0-1 maximum capacity
    resonance: Resonance;
    protection: Protection;
    field: Field;
    timestamp: number;
  };
  source?: string;      // ID of source pattern
  destination?: string; // ID of destination pattern
}

export class EnergyEngine {
  private patterns = new Map<string, EnergyPattern>();
  private updates = new Subject<EnergyPattern>();
  private systemEnergy = new BehaviorSubject<number>(1.0); // Total system energy

  public observe(): Observable<EnergyPattern[]> {
    return this.updates.pipe(
      debounceTime(100), // Natural rhythm
      map(() => this.current())
    );
  }

  public observeSystemEnergy(): Observable<number> {
    return this.systemEnergy.asObservable();
  }

  public async create(
    type: EnergyType,
    initialEnergy: number = 0.5
  ): Promise<EnergyPattern> {
    const pattern: EnergyPattern = {
      id: this.createId(),
      type,
      state: {
        mode: 'potential',
        level: initialEnergy,
        capacity: 1.0,
        resonance: {
          frequency: 0.5,
          amplitude: 0.5,
          harmony: 1.0,
          field: {
            center: { x: 0, y: 0, z: 0 },
            radius: 1,
            strength: initialEnergy,
            waves: []
          }
        },
        protection: {
          strength: 0.3,
          resilience: 0.3,
          adaptability: 0.5
        },
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: initialEnergy,
          waves: []
        },
        timestamp: Date.now()
      }
    };

    this.patterns.set(pattern.id, pattern);
    this.updates.next(pattern);
    await this.updateSystemEnergy();

    return pattern;
  }

  public async flow(
    sourceId: string,
    destinationId: string,
    amount: number
  ): Promise<boolean> {
    const source = this.patterns.get(sourceId);
    const destination = this.patterns.get(destinationId);
    if (!source || !destination) return false;

    // Natural flow - respect capacity and conservation
    const actualFlow = Math.min(
      amount,
      source.state.level,
      destination.state.capacity - destination.state.level
    );

    if (actualFlow <= 0) return false;

    // Update source
    const updatedSource = await this.adjust(sourceId, {
      mode: 'flowing',
      level: source.state.level - actualFlow
    });

    // Update destination
    const updatedDest = await this.adjust(destinationId, {
      mode: 'flowing',
      level: destination.state.level + actualFlow
    });

    // Record flow relationship
    updatedSource.destination = destinationId;
    updatedDest.source = sourceId;

    this.patterns.set(sourceId, updatedSource);
    this.patterns.set(destinationId, updatedDest);
    
    await this.updateSystemEnergy();
    return true;
  }

  public async radiate(
    sourceId: string,
    radius: number = 1
  ): Promise<void> {
    const source = this.patterns.get(sourceId);
    if (!source) return;

    // Transform to radiating state
    const updated = await this.adjust(sourceId, {
      mode: 'radiating',
      field: {
        ...source.state.field,
        radius,
        strength: source.state.level
      }
    });

    // Natural energy distribution
    const nearbyPatterns = this.findPatternsInRadius(updated.state.field);
    for (const pattern of nearbyPatterns) {
      if (pattern.id === sourceId) continue;
      
      const distance = this.calculateDistance(updated.state.field.center, pattern.state.field.center);
      const energyTransfer = (updated.state.level * 0.1) * (1 - distance/radius);
      
      if (energyTransfer > 0) {
        await this.flow(sourceId, pattern.id, energyTransfer);
      }
    }
  }

  public async still(
    patternId: string
  ): Promise<void> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    // Transform to still state - deepens and stabilizes
    await this.adjust(patternId, {
      mode: 'still',
      protection: {
        strength: Math.min(1, pattern.state.protection.strength + 0.2),
        resilience: Math.min(1, pattern.state.protection.resilience + 0.2),
        adaptability: Math.max(0.2, pattern.state.protection.adaptability - 0.1)
      }
    });
  }

  public async adjust(
    id: string,
    changes: Partial<EnergyPattern['state']>
  ): Promise<EnergyPattern> {
    const pattern = this.patterns.get(id);
    if (!pattern) throw new Error('Energy pattern not found');

    // Natural adaptation
    const updated: EnergyPattern = {
      ...pattern,
      state: {
        ...pattern.state,
        ...changes,
        timestamp: Date.now()
      }
    };

    // Maintain protection based on state
    if (updated.state.mode === 'still') {
      updated.state.protection.strength = Math.max(
        updated.state.protection.strength,
        0.7
      );
    }

    this.patterns.set(id, updated);
    this.updates.next(updated);
    await this.updateSystemEnergy();

    return updated;
  }

  private async updateSystemEnergy(): Promise<void> {
    const patterns = this.current();
    const totalEnergy = patterns.reduce(
      (sum, p) => sum + p.state.level,
      0
    );
    
    this.systemEnergy.next(totalEnergy);
  }

  private findPatternsInRadius(field: Field): EnergyPattern[] {
    return this.current().filter(pattern => {
      const distance = this.calculateDistance(
        field.center,
        pattern.state.field.center
      );
      return distance <= field.radius;
    });
  }

  private calculateDistance(
    a: { x: number; y: number; z: number },
    b: { x: number; y: number; z: number }
  ): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private createId(): string {
    return `energy_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private current(): EnergyPattern[] {
    return Array.from(this.patterns.values());
  }
} 