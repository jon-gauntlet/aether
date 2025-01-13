import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NaturalSystem } from '../natural/NaturalSystem';

interface Boundary {
  strength: number;
  resilience: number;
  adaptability: number;
}

interface Boundaries {
  flow: Boundary;
  energy: Boundary;
  presence: Boundary;
}

export class ProtectionSystem extends NaturalSystem {
  private protectionPatterns = new Map<string, number>();
  private boundaries: Boundaries = {
    flow: { strength: 1, resilience: 1, adaptability: 1 },
    energy: { strength: 1, resilience: 1, adaptability: 1 },
    presence: { strength: 1, resilience: 1, adaptability: 1 }
  };

  protected onCycleComplete(): void {
    const state = this.state$.value;
    
    // Protection pattern recognition
    const protectionSignature = this.calculateProtectionSignature(state);
    this.updateProtectionPatterns(protectionSignature);
    
    // Protection state evolution
    const optimalProtection = this.calculateOptimalProtection();
    const currentProtection = state.protection;
    const protectionDelta = optimalProtection - currentProtection;
    
    // Natural adaptation
    if (Math.abs(protectionDelta) > 0.1 || this.shouldAdjustBoundaries(state)) {
      const updatedBoundaries = this.evolveBoundaries(this.boundaries, state);
      this.boundaries = updatedBoundaries;
      
      this.state$.next({
        ...state,
        protection: this.adaptProtection(state.protection, protectionDelta),
        coherence: this.adaptCoherence(state.coherence, protectionDelta),
        resonance: this.adaptResonance(state.resonance, protectionDelta),
        patterns: this.evolveProtectionPatterns(state.patterns, protectionDelta)
      });
    }
  }

  private calculateProtectionSignature(state: any): string {
    const { protection, coherence, resonance } = state;
    return `${protection.toFixed(2)}_${coherence.toFixed(2)}_${resonance.toFixed(2)}`;
  }

  private updateProtectionPatterns(signature: string): void {
    const currentStrength = this.protectionPatterns.get(signature) || 0;
    this.protectionPatterns.set(signature, Math.min(1, currentStrength + 0.1));
    
    // Prune weak patterns
    for (const [pattern, strength] of this.protectionPatterns.entries()) {
      if (strength < 0.3) {
        this.protectionPatterns.delete(pattern);
      }
    }
    
    // Keep only strongest patterns
    if (this.protectionPatterns.size > 5) {
      const sortedPatterns = Array.from(this.protectionPatterns.entries())
        .sort(([, a], [, b]) => b - a);
      this.protectionPatterns = new Map(sortedPatterns.slice(0, 5));
    }
  }

  private calculateOptimalProtection(): number {
    if (this.protectionPatterns.size === 0) return 0.8; // Default optimal protection
    
    // Weight patterns by strength
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const [pattern, strength] of this.protectionPatterns.entries()) {
      const [protection] = pattern.split('_').map(Number);
      weightedSum += protection * strength;
      totalWeight += strength;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0.8;
  }

  private shouldAdjustBoundaries(state: any): boolean {
    return state.protection < 0.5 || 
           state.coherence < 0.4 || 
           state.resonance < 0.3;
  }

  private evolveBoundaries(boundaries: Boundaries, state: any): Boundaries {
    const evolutionRate = 0.1;
    const coherenceFactor = state.coherence;
    
    return {
      flow: this.evolveBoundary(boundaries.flow, state.presence, evolutionRate, coherenceFactor),
      energy: this.evolveBoundary(boundaries.energy, state.energy, evolutionRate, coherenceFactor),
      presence: this.evolveBoundary(boundaries.presence, state.presence, evolutionRate, coherenceFactor)
    };
  }

  private evolveBoundary(boundary: Boundary, stateValue: number, rate: number, coherence: number): Boundary {
    const delta = stateValue - 0.5; // Optimal state reference
    
    return {
      strength: Math.min(1, Math.max(0.3, boundary.strength + delta * rate * coherence)),
      resilience: Math.min(1, Math.max(0.3, boundary.resilience + Math.abs(delta) * rate)),
      adaptability: Math.min(1, Math.max(0.3, boundary.adaptability + rate * coherence))
    };
  }

  private adaptProtection(current: number, delta: number): number {
    return Math.min(1, Math.max(0.3, current + delta * 0.3));
  }

  private adaptCoherence(current: number, delta: number): number {
    return Math.min(1, Math.max(0, current + delta * 0.2));
  }

  private adaptResonance(current: number, delta: number): number {
    return Math.min(1, Math.max(0, current + delta * 0.1));
  }

  private evolveProtectionPatterns(patterns: any[], delta: number): any[] {
    return patterns.map(pattern => ({
      ...pattern,
      strength: Math.min(1, pattern.strength + Math.abs(delta) * 0.1),
      resonance: Math.min(1, pattern.resonance + delta * 0.05)
    }));
  }

  public observeProtection(): Observable<number> {
    return this.state$.pipe(
      map(state => state.protection)
    );
  }

  public observeBoundaries(): Observable<Boundaries> {
    return this.observe().pipe(
      map(() => this.boundaries)
    );
  }

  public observePatterns(): Observable<Map<string, number>> {
    return this.observe().pipe(
      map(() => new Map(this.protectionPatterns))
    );
  }
} 