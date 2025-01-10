import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import type { Field, Protection, Resonance } from '../types/consciousness';

export type EnergyQuality = 
  | 'vital'      // Life force
  | 'creative'   // Generation
  | 'protective' // Preservation
  | 'peaceful'   // Harmony
  | 'still'      // Contemplation
  | 'purifying'  // Refinement
  | 'unifying'   // Connection
  | 'transformative'; // Evolution

export type EnergyState = 
  | 'potential'  // Latent
  | 'flowing'    // Active
  | 'radiating'  // Giving
  | 'still'      // Peaceful
  | 'purifying'  // Cleansing
  | 'unifying';  // Harmonizing

export interface EnergyPattern {
  id: string;
  quality: EnergyQuality;
  state: {
    mode: EnergyState;
    level: number;        // Current strength (0-1)
    capacity: number;     // Maximum potential (0-1)
    purity: number;       // Refinement level (0-1)
    peace: number;        // Harmony level (0-1)
    resonance: Resonance; // Vibrational qualities
    protection: Protection; // Preservation aspects
    field: Field;        // Spatial influence
    timestamp: number;   // State timing
  };
  source?: string;      // Origin pattern ID
  destination?: string; // Target pattern ID
}

/**
 * EnergyEngine manages the flow and transformation of energy patterns
 * throughout the system, maintaining natural harmony and protection.
 */
export class EnergyEngine {
  private patterns = new Map<string, EnergyPattern>();
  private updates = new Subject<EnergyPattern>();
  private systemState = new BehaviorSubject<{
    vitality: number;   // Overall energy (0-1)
    harmony: number;    // System peace (0-1)
    purity: number;     // System refinement (0-1)
    protection: number; // System preservation (0-1)
  }>({
    vitality: 1.0,
    harmony: 1.0,
    purity: 1.0,
    protection: 1.0
  });

  // System Observation
  public observePatterns(): Observable<EnergyPattern[]> {
    return this.updates.pipe(
      debounceTime(16), // Natural rhythm (60fps)
      map(() => Array.from(this.patterns.values())),
      distinctUntilChanged()
    );
  }

  public observeSystemState(): Observable<{
    vitality: number;
    harmony: number;
    purity: number;
    protection: number;
  }> {
    return this.systemState.asObservable();
  }

  // Pattern Creation
  public async createPattern(
    quality: EnergyQuality,
    initialEnergy: number = 0.5
  ): Promise<EnergyPattern> {
    const pattern: EnergyPattern = {
      id: this.generateId(),
      quality,
      state: {
        mode: 'potential',
        level: initialEnergy,
        capacity: 1.0,
        purity: quality === 'purifying' ? 0.9 : 0.5,
        peace: quality === 'peaceful' ? 0.9 : 0.5,
        resonance: this.createInitialResonance(quality, initialEnergy),
        protection: this.createInitialProtection(quality),
        field: this.createInitialField(initialEnergy),
        timestamp: Date.now()
      }
    };

    this.patterns.set(pattern.id, pattern);
    this.updates.next(pattern);
    await this.maintainSystemState();

    return pattern;
  }

  // Natural Flow
  public async flowBetween(
    sourceId: string,
    destinationId: string,
    amount: number
  ): Promise<boolean> {
    const source = this.patterns.get(sourceId);
    const destination = this.patterns.get(destinationId);
    if (!source || !destination) return false;

    // Natural conservation
    const actualFlow = Math.min(
      amount,
      source.state.level,
      destination.state.capacity - destination.state.level
    );

    if (actualFlow <= 0) return false;

    // Update patterns
    await Promise.all([
      this.adjustPattern(sourceId, {
        mode: 'flowing',
        level: source.state.level - actualFlow
      }),
      this.adjustPattern(destinationId, {
        mode: 'flowing',
        level: destination.state.level + actualFlow
      })
    ]);

    // Record connection
    source.destination = destinationId;
    destination.source = sourceId;

    await this.maintainSystemState();
    return true;
  }

  // Radiant Influence
  public async radiate(
    sourceId: string,
    radius: number = 1
  ): Promise<void> {
    const source = this.patterns.get(sourceId);
    if (!source) return;

    // Transform state
    await this.adjustPattern(sourceId, {
      mode: 'radiating',
      field: {
        ...source.state.field,
        radius,
        strength: source.state.level
      }
    });

    // Natural distribution
    const nearbyPatterns = this.findPatternsInRadius(source.state.field);
    const radiationPromises = nearbyPatterns
      .filter(p => p.id !== sourceId)
      .map(pattern => {
        const distance = this.calculateDistance(
          source.state.field.center,
          pattern.state.field.center
        );
        const energyTransfer = (source.state.level * 0.1) * (1 - distance/radius);
        
        return energyTransfer > 0
          ? this.flowBetween(sourceId, pattern.id, energyTransfer)
          : Promise.resolve(false);
      });

    await Promise.all(radiationPromises);
  }

  // Stillness Cultivation
  public async cultivateStillness(
    patternId: string
  ): Promise<void> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    await this.adjustPattern(patternId, {
      mode: 'still',
      protection: {
        level: Math.min(1, pattern.state.protection.level + 0.2),
        strength: Math.min(1, pattern.state.protection.strength + 0.2),
        resilience: Math.min(1, pattern.state.protection.resilience + 0.2),
        adaptability: Math.max(0.2, pattern.state.protection.adaptability - 0.1),
        field: {
          ...pattern.state.protection.field,
          strength: Math.min(1, pattern.state.protection.field.strength + 0.2)
        }
      },
      peace: Math.min(1, pattern.state.peace + 0.1)
    });
  }

  // Pattern Refinement
  public async refinePattern(
    patternId: string,
    intensity: number = 0.5
  ): Promise<void> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    await this.adjustPattern(patternId, {
      mode: 'purifying',
      purity: Math.min(1, pattern.state.purity + intensity * 0.2),
      peace: Math.min(1, pattern.state.peace + intensity * 0.1),
      protection: {
        level: Math.min(1, pattern.state.protection.level + intensity * 0.1),
        strength: Math.min(1, pattern.state.protection.strength + intensity * 0.1),
        resilience: Math.min(1, pattern.state.protection.resilience + intensity * 0.1),
        adaptability: Math.max(0.2, pattern.state.protection.adaptability - intensity * 0.1),
        field: {
          ...pattern.state.protection.field,
          strength: Math.min(1, pattern.state.protection.field.strength + intensity * 0.1)
        }
      }
    });
  }

  // Pattern Harmonization
  public async harmonizePattern(
    patternId: string,
    intensity: number = 0.5
  ): Promise<void> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    await this.adjustPattern(patternId, {
      mode: 'unifying',
      peace: Math.min(1, pattern.state.peace + intensity * 0.2),
      resonance: {
        ...pattern.state.resonance,
        harmony: Math.min(1, pattern.state.resonance.harmony + intensity * 0.1)
      }
    });
  }

  // Protected Methods
  protected async adjustPattern(
    id: string,
    changes: Partial<EnergyPattern['state']>
  ): Promise<EnergyPattern> {
    const pattern = this.patterns.get(id);
    if (!pattern) throw new Error('Pattern not found');

    const updated: EnergyPattern = {
      ...pattern,
      state: {
        ...pattern.state,
        ...changes,
        timestamp: Date.now()
      }
    };

    // Natural protection
    if (updated.state.mode === 'still') {
      updated.state.protection = {
        ...updated.state.protection,
        level: Math.max(updated.state.protection.level, 0.7),
        strength: Math.max(updated.state.protection.strength, 0.7),
        field: {
          ...updated.state.protection.field,
          strength: Math.max(updated.state.protection.field.strength, 0.7)
        }
      };
    }

    this.patterns.set(id, updated);
    this.updates.next(updated);
    await this.maintainSystemState();

    return updated;
  }

  // Private Helpers
  private async maintainSystemState(): Promise<void> {
    const patterns = Array.from(this.patterns.values());
    
    this.systemState.next({
      vitality: this.calculateSystemVitality(patterns),
      harmony: this.calculateSystemHarmony(patterns),
      purity: this.calculateSystemPurity(patterns),
      protection: this.calculateSystemProtection(patterns)
    });
  }

  private calculateSystemVitality(patterns: EnergyPattern[]): number {
    if (patterns.length === 0) return 1;
    return patterns.reduce((sum, p) => sum + p.state.level, 0) / patterns.length;
  }

  private calculateSystemHarmony(patterns: EnergyPattern[]): number {
    if (patterns.length === 0) return 1;
    return patterns.reduce((sum, p) => sum + p.state.peace, 0) / patterns.length;
  }

  private calculateSystemPurity(patterns: EnergyPattern[]): number {
    if (patterns.length === 0) return 1;
    return patterns.reduce((sum, p) => sum + p.state.purity, 0) / patterns.length;
  }

  private calculateSystemProtection(patterns: EnergyPattern[]): number {
    if (patterns.length === 0) return 1;
    return patterns.reduce((sum, p) => sum + p.state.protection.strength, 0) / patterns.length;
  }

  private createInitialResonance(quality: EnergyQuality, level: number): Resonance {
    return {
      frequency: quality === 'vital' ? 0.7 : 0.5,
      amplitude: quality === 'transformative' ? 0.7 : 0.5,
      harmony: quality === 'peaceful' ? 0.9 : 0.5,
      field: this.createInitialField(level),
      essence: quality === 'peaceful' ? 0.9 : 0.5
    };
  }

  private createInitialProtection(quality: EnergyQuality): Protection {
    return {
      level: quality === 'protective' ? 0.7 : 0.3,
      strength: quality === 'protective' ? 0.7 : 0.3,
      resilience: quality === 'protective' ? 0.7 : 0.3,
      adaptability: quality === 'transformative' ? 0.7 : 0.5,
      field: this.createInitialField(quality === 'protective' ? 0.7 : 0.3)
    };
  }

  private createInitialField(strength: number): Field {
    return {
      center: { x: 0, y: 0, z: 0 },
      radius: 1,
      strength,
      waves: []
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private findPatternsInRadius(field: Field): EnergyPattern[] {
    return Array.from(this.patterns.values()).filter(pattern => 
      this.calculateDistance(field.center, pattern.state.field.center) <= field.radius
    );
  }

  private calculateDistance(
    p1: { x: number; y: number; z: number },
    p2: { x: number; y: number; z: number }
  ): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
} 