import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';

export interface PatternConditions {
  flowState?: FlowState;
  minFieldStrength?: number;
  minResonance?: number;
  maxResistance?: number;
  [key: string]: any;
}

export interface Pattern {
  id: string;
  name: string;
  conditions: PatternConditions;
  weight: number;
  activations: number;
}

export interface PatternMatch {
  pattern: Pattern;
  confidence: number;
  matchedConditions: string[];
}

export class PatternSystem {
  private patterns: Map<string, Pattern>;

  constructor() {
    this.patterns = new Map();
  }

  public addPattern(pattern: Pattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  public removePattern(id: string): void {
    this.patterns.delete(id);
  }

  public getPattern(id: string): Pattern | undefined {
    return this.patterns.get(id);
  }

  public updatePattern(pattern: Pattern): void {
    if (this.patterns.has(pattern.id)) {
      this.patterns.set(pattern.id, pattern);
    }
  }

  public activatePattern(id: string): void {
    const pattern = this.patterns.get(id);
    if (pattern) {
      pattern.activations += 1;
      this.patterns.set(id, pattern);
    }
  }

  public findMatches(field: Field, consciousness: ConsciousnessState): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const pattern of this.patterns.values()) {
      const { confidence, matchedConditions } = this.evaluatePattern(pattern, field, consciousness);
      
      if (confidence > 0) {
        matches.push({
          pattern,
          confidence: confidence * pattern.weight,
          matchedConditions
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  private evaluatePattern(
    pattern: Pattern,
    field: Field,
    consciousness: ConsciousnessState
  ): { confidence: number; matchedConditions: string[] } {
    const { conditions } = pattern;
    const matchedConditions: string[] = [];
    let totalConfidence = 0;
    let conditionCount = 0;

    // Flow State
    if (conditions.flowState !== undefined) {
      conditionCount++;
      if (consciousness.currentState === conditions.flowState) {
        matchedConditions.push('flowState');
        totalConfidence += 1;
      } else {
        return { confidence: 0, matchedConditions: [] };
      }
    }

    // Field Strength
    if (conditions.minFieldStrength !== undefined) {
      conditionCount++;
      if (field.strength >= conditions.minFieldStrength) {
        matchedConditions.push('fieldStrength');
        totalConfidence += field.strength;
      } else {
        return { confidence: 0, matchedConditions: [] };
      }
    }

    // Resonance
    if (conditions.minResonance !== undefined) {
      conditionCount++;
      if (field.resonance.amplitude >= conditions.minResonance) {
        matchedConditions.push('resonance');
        totalConfidence += field.resonance.amplitude;
      } else {
        return { confidence: 0, matchedConditions: [] };
      }
    }

    // Resistance
    if (conditions.maxResistance !== undefined) {
      conditionCount++;
      if (field.flowMetrics.resistance <= conditions.maxResistance) {
        matchedConditions.push('resistance');
        totalConfidence += 1 - field.flowMetrics.resistance;
      } else {
        return { confidence: 0, matchedConditions: [] };
      }
    }

    return {
      confidence: conditionCount > 0 ? totalConfidence / conditionCount : 0,
      matchedConditions
    };
  }
} 