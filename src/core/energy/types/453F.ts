import { Context } from '../context/types';
import { Energy } from '../energy/types';
import { Flow } from '../flow/types';

export interface Pattern {
  id: string;
  name: string;
  description: string;
  context: Context;
  energy: Energy;
  flow: Flow;
  meta: PatternMeta;
}

export interface PatternMeta {
  created: Date;
  lastUsed: Date;
  useCount: number;
  successRate: number;
  learnings: Learning[];
  type: 'energy' | 'flow' | 'autonomic' | 'consciousness';
  energyEfficiency: number;
  flowOptimization: number;
}

export interface Learning {
  id: string;
  timestamp: Date;
  insight: string;
  context: Context;
  pattern: Pattern;
}

export interface PatternLibrary {
  patterns: Pattern[];
  meta: LibraryMeta;
  addPattern(pattern: Pattern): void;
  findPattern(context: Context): Pattern[];
  evolvePattern(pattern: Pattern, learning: Learning): Pattern;
}

export interface LibraryMeta {
  created: Date;
  lastEvolved: Date;
  patternCount: number;
  evolutionCount: number;
  insights: string[];
  indexStats: {
    lastIndexed: Date;
    indexedCount: number;
  };
} 