import type { BaseType, Pattern } from './base';

export interface AIAwareSystem {
  awareness: number;
  confidence: number;
  adaptability: number;
  patterns: Pattern[];
}

export interface AIEnhancedSpace {
  enhancement: number;
  stability: number;
  resonance: number;
  patterns: Pattern[];
}

export interface Context {
  timestamp: number;
  patterns: Pattern[];
  metrics: {
    confidence: number;
    relevance: number;
    impact: number;
  };
}