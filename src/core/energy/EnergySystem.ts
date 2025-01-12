import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NaturalSystem } from '../natural/NaturalSystem';

export class EnergySystem extends NaturalSystem {
  private energyPatterns = new Map<string, number>();
  private lastEnergyLevel: number = 1;
  
  protected onCycleComplete(): void {
    const state = this.state$.value;
    
    // Energy pattern recognition
    const energySignature = this.calculateEnergySignature(state);
    this.updateEnergyPatterns(energySignature);
    
    // Energy state evolution
    const optimalEnergy = this.calculateOptimalEnergy();
    const currentEnergy = state.energy;
    const energyDelta = optimalEnergy - currentEnergy;
    
    // Natural adaptation
    if (Math.abs(energyDelta) > 0.1 || this.shouldAdjustEnergy(state)) {
      this.lastEnergyLevel = state.energy;
      this.state$.next({
        ...state,
        energy: this.adaptEnergy(state.energy, energyDelta),
        coherence: this.adaptCoherence(state.coherence, energyDelta),
        resonance: this.adaptResonance(state.resonance, energyDelta),
        patterns: this.evolveEnergyPatterns(state.patterns, energyDelta)
      });
    }
  }

  private calculateEnergySignature(state: any): string {
    const { energy, coherence, resonance } = state;
    return `${energy.toFixed(2)}_${coherence.toFixed(2)}_${resonance.toFixed(2)}`;
  }

  private updateEnergyPatterns(signature: string): void {
    const currentStrength = this.energyPatterns.get(signature) || 0;
    this.energyPatterns.set(signature, Math.min(1, currentStrength + 0.1));
    
    // Prune weak patterns
    for (const [pattern, strength] of this.energyPatterns.entries()) {
      if (strength < 0.3) {
        this.energyPatterns.delete(pattern);
      }
    }
    
    // Keep only strongest patterns
    if (this.energyPatterns.size > 5) {
      const sortedPatterns = Array.from(this.energyPatterns.entries())
        .sort(([, a], [, b]) => b - a);
      this.energyPatterns = new Map(sortedPatterns.slice(0, 5));
    }
  }

  private calculateOptimalEnergy(): number {
    if (this.energyPatterns.size === 0) return 0.8; // Default optimal energy
    
    // Weight patterns by strength
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const [pattern, strength] of this.energyPatterns.entries()) {
      const [energy] = pattern.split('_').map(Number);
      weightedSum += energy * strength;
      totalWeight += strength;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0.8;
  }

  private shouldAdjustEnergy(state: any): boolean {
    const energyDiff = Math.abs(state.energy - this.lastEnergyLevel);
    return energyDiff > 0.2 || state.energy < 0.3;
  }

  private adaptEnergy(current: number, delta: number): number {
    return Math.min(1, Math.max(0.3, current + delta * 0.3));
  }

  private adaptCoherence(current: number, delta: number): number {
    return Math.min(1, Math.max(0, current + delta * 0.2));
  }

  private adaptResonance(current: number, delta: number): number {
    return Math.min(1, Math.max(0, current + delta * 0.1));
  }

  private evolveEnergyPatterns(patterns: any[], delta: number): any[] {
    return patterns.map(pattern => ({
      ...pattern,
      strength: Math.min(1, pattern.strength + Math.abs(delta) * 0.1),
      resonance: Math.min(1, pattern.resonance + delta * 0.05)
    }));
  }

  public observeEnergy(): Observable<number> {
    return this.state$.pipe(
      map(state => state.energy)
    );
  }

  public observePatterns(): Observable<Map<string, number>> {
    return this.observe().pipe(
      map(() => new Map(this.energyPatterns))
    );
  }
} 