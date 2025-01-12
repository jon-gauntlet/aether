import { Field, ProtectionType } from '../base';

export interface Protection {
  level: number;
  type: ProtectionType;
  strength: number;
  resilience: number;
  adaptability: number;
  field: Field;
  natural: boolean;
}

export interface ProtectionState {
  level: number;
  type: ProtectionType;
  strength: number;
  resilience: number;
  adaptability: number;
  field: Field;
  natural: boolean;
  patterns: Pattern[];
  timestamp: number;
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  strength: number;
  evolution: {
    stage: number;
    history: string[];
    lastEvolved: string;
    entropyLevel: number;
    metrics?: {
      coherence: number;
      stability: number;
      adaptability: number;
      resilience: number;
    };
  };
  metadata?: {
    tags: string[];
    category: string;
    priority: number;
  };
}
