import { 
  NaturalPattern, 
  FlowState, 
  Wave,
  SacredSpace
} from '../types/base';

export class PatternRecognition {
  private readonly naturalRhythm = 1.618033988749895; // Golden ratio

  public detectPatterns(state: FlowState): NaturalPattern[] {
    const flowPatterns = this.detectFlowPatterns(state.metrics);
    return flowPatterns;
  }

  private detectFlowPatterns(metrics: FlowState['metrics']): NaturalPattern[] {
    const patterns: NaturalPattern[] = [];

    // Flow pattern
    if (metrics.velocity > 0.8 && metrics.focus > 0.8) {
      patterns.push({
        id: crypto.randomUUID(),
        type: 'flow',
        strength: metrics.velocity,
        resonance: metrics.focus,
        evolution: metrics.energy
      });
    }

    // Focus pattern
    if (metrics.focus > 0.9 && metrics.energy > 0.8) {
      patterns.push({
        id: crypto.randomUUID(),
        type: 'focus',
        strength: metrics.focus,
        resonance: metrics.energy,
        evolution: metrics.velocity
      });
    }

    // Energy pattern
    if (metrics.energy > 0.9 && metrics.velocity > 0.8) {
      patterns.push({
        id: crypto.randomUUID(),
        type: 'energy',
        strength: metrics.energy,
        resonance: metrics.velocity,
        evolution: metrics.focus
      });
    }

    return patterns;
  }

  public analyzeEvolution(patterns: NaturalPattern[]): number {
    if (patterns.length === 0) return 0;

    const evolutionSum = patterns.reduce((sum, pattern) => {
      const resonanceStrength = pattern.resonance * pattern.strength;
      const evolutionPotential = pattern.evolution * this.naturalRhythm;
      return sum + (resonanceStrength * evolutionPotential);
    }, 0);

    return Math.min(evolutionSum / patterns.length, 1);
  }
} 