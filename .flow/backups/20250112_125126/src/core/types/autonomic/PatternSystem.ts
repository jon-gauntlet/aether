import { Field } from '../base';
import { ConsciousnessState } from '../consciousness/consciousness';

export interface Pattern {
  id: string;
  type: string;
  confidence: number;
  timestamp: number;
}

export interface PatternMatch extends Pattern {
  field: Field;
  consciousness: ConsciousnessState;
  metrics: {
    stability: number;
    coherence: number;
    resonance: number;
  };
}

export class PatternSystem {
  private patterns: Pattern[] = [];

  public findMatches(field: Field, consciousness: ConsciousnessState): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const timestamp = Date.now();

    // Check field stability pattern
    if (field.protection.stability > 0.8) {
      matches.push({
        id: `stability-${timestamp}`,
        type: 'field-stability',
        confidence: field.protection.stability,
        field,
        consciousness,
        timestamp,
        metrics: {
          stability: field.protection.stability,
          coherence: consciousness.flowSpace.coherence,
          resonance: consciousness.flowSpace.resonance
        }
      });
    }

    // Check consciousness coherence pattern
    if (consciousness.flowSpace.coherence > 0.8) {
      matches.push({
        id: `coherence-${timestamp}`,
        type: 'consciousness-coherence',
        confidence: consciousness.flowSpace.coherence,
        field,
        consciousness,
        timestamp,
        metrics: {
          stability: field.protection.stability,
          coherence: consciousness.flowSpace.coherence,
          resonance: consciousness.flowSpace.resonance
        }
      });
    }

    // Check resonance pattern
    if (consciousness.flowSpace.resonance > 0.8) {
      matches.push({
        id: `resonance-${timestamp}`,
        type: 'resonance-harmony',
        confidence: consciousness.flowSpace.resonance,
        field,
        consciousness,
        timestamp,
        metrics: {
          stability: field.protection.stability,
          coherence: consciousness.flowSpace.coherence,
          resonance: consciousness.flowSpace.resonance
        }
      });
    }

    return matches;
  }
} 