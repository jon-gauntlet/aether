import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NaturalSystem } from '../natural/NaturalSystem';

export class NaturalFlow extends NaturalSystem {
  private flowPatterns = new Map<string, number>();
  
  protected onCycleComplete(): void {
    const state = this.state$.value;
    
    // Flow pattern recognition
    const flowSignature = this.calculateFlowSignature(state);
    this.updateFlowPatterns(flowSignature);
    
    // Flow state evolution
    const optimalFlow = this.calculateOptimalFlow();
    const currentFlow = state.presence * state.harmony;
    const flowDelta = optimalFlow - currentFlow;
    
    // Natural adaptation
    if (Math.abs(flowDelta) > 0.1) {
      this.state$.next({
        ...state,
        presence: this.adaptPresence(state.presence, flowDelta),
        harmony: this.adaptHarmony(state.harmony, flowDelta),
        resonance: this.adaptResonance(state.resonance, flowDelta),
        patterns: this.evolveFlowPatterns(state.patterns, flowDelta)
      });
    }
  }

  private calculateFlowSignature(state: any): string {
    const { presence, harmony, resonance } = state;
    return `${presence.toFixed(2)}_${harmony.toFixed(2)}_${resonance.toFixed(2)}`;
  }

  private updateFlowPatterns(signature: string): void {
    const currentStrength = this.flowPatterns.get(signature) || 0;
    this.flowPatterns.set(signature, Math.min(1, currentStrength + 0.1));
    
    // Prune weak patterns
    for (const [pattern, strength] of this.flowPatterns.entries()) {
      if (strength < 0.3) {
        this.flowPatterns.delete(pattern);
      }
    }
    
    // Keep only strongest patterns
    if (this.flowPatterns.size > 5) {
      const sortedPatterns = Array.from(this.flowPatterns.entries())
        .sort(([, a], [, b]) => b - a);
      this.flowPatterns = new Map(sortedPatterns.slice(0, 5));
    }
  }

  private calculateOptimalFlow(): number {
    if (this.flowPatterns.size === 0) return 0.8; // Default optimal flow
    
    // Weight patterns by strength
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const [pattern, strength] of this.flowPatterns.entries()) {
      const [presence, harmony] = pattern.split('_').map(Number);
      const flow = presence * harmony;
      weightedSum += flow * strength;
      totalWeight += strength;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0.8;
  }

  private adaptPresence(current: number, delta: number): number {
    return Math.min(1, Math.max(0, current + delta * 0.3));
  }

  private adaptHarmony(current: number, delta: number): number {
    return Math.min(1, Math.max(0, current + delta * 0.2));
  }

  private adaptResonance(current: number, delta: number): number {
    return Math.min(1, Math.max(0, current + delta * 0.1));
  }

  private evolveFlowPatterns(patterns: any[], delta: number): any[] {
    return patterns.map(pattern => ({
      ...pattern,
      strength: Math.min(1, pattern.strength + Math.abs(delta) * 0.1),
      resonance: Math.min(1, pattern.resonance + delta * 0.05)
    }));
  }

  public observeFlow(): Observable<number> {
    return this.state$.pipe(
      map(state => state.presence * state.harmony)
    );
  }

  public observePatterns(): Observable<Map<string, number>> {
    return this.observe().pipe(
      map(() => new Map(this.flowPatterns))
    );
  }
} 