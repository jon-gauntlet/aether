import { Pattern, Learning, LibraryMeta } from './types';
import { Context } from '../context/types';
import { v4 as uuidv4 } from 'uuid';
import { SystemIndex } from '../index/types';

export class AutonomicPatternLibrary {
  patterns: Pattern[] = [];
  meta: LibraryMeta;
  private indexedPatterns: Map<string, Pattern[]> = new Map();

  constructor() {
    this.meta = {
      created: new Date(),
      lastEvolved: new Date(),
      patternCount: 0,
      evolutionCount: 0,
      insights: [],
      indexStats: {
        lastIndexed: new Date(),
        indexedCount: 0
      }
    };
  }

  addPattern(pattern: Pattern): void {
    pattern.id = pattern.id || uuidv4();
    pattern.meta.created = new Date();
    this.patterns.push(pattern);
    this.meta.patternCount++;
    this.meta.lastEvolved = new Date();
    this.indexPattern(pattern);
  }

  findPattern(context: Context, systemIndex?: SystemIndex): Pattern[] {
    // First check indexed patterns
    const indexKey = this.generateIndexKey(context);
    const indexedResults = this.indexedPatterns.get(indexKey) || [];
    
    // Combine with traditional search
    const standardResults = this.patterns.filter(pattern => 
      this.matchesContext(pattern.context, context)
    );

    const results = [...new Set([...indexedResults, ...standardResults])];

    // Apply system index scoring if available
    if (systemIndex) {
      return results.sort((a, b) => {
        const aScore = systemIndex.getPatternScore(a.id);
        const bScore = systemIndex.getPatternScore(b.id);
        return bScore - aScore;
      });
    }

    return results.sort((a, b) => {
      const aScore = a.meta.successRate * Math.log(a.meta.useCount + 1);
      const bScore = b.meta.successRate * Math.log(b.meta.useCount + 1);
      return bScore - aScore;
    });
  }

  evolvePattern(pattern: Pattern, learning: Learning): Pattern {
    const evolvedPattern = { ...pattern };
    
    // Update pattern meta
    evolvedPattern.meta.lastUsed = new Date();
    evolvedPattern.meta.useCount++;
    evolvedPattern.meta.learnings.push(learning);
    
    // Update success rate
    const successCount = evolvedPattern.meta.learnings.filter(l => l.insight.includes('success')).length;
    evolvedPattern.meta.successRate = successCount / evolvedPattern.meta.learnings.length;

    // Update library meta
    this.meta.evolutionCount++;
    this.meta.lastEvolved = new Date();
    if (learning.insight) {
      this.meta.insights.push(learning.insight);
    }

    // Replace old pattern and update index
    const index = this.patterns.findIndex(p => p.id === pattern.id);
    if (index >= 0) {
      this.patterns[index] = evolvedPattern;
      this.indexPattern(evolvedPattern);
    }

    return evolvedPattern;
  }

  private indexPattern(pattern: Pattern): void {
    const indexKey = this.generateIndexKey(pattern.context);
    if (!this.indexedPatterns.has(indexKey)) {
      this.indexedPatterns.set(indexKey, []);
    }
    const patterns = this.indexedPatterns.get(indexKey)!;
    const existingIndex = patterns.findIndex(p => p.id === pattern.id);
    if (existingIndex >= 0) {
      patterns[existingIndex] = pattern;
    } else {
      patterns.push(pattern);
      this.meta.indexStats.indexedCount++;
      this.meta.indexStats.lastIndexed = new Date();
    }
  }

  private generateIndexKey(context: Context): string {
    return `${context.type}:${context.depth}:${context.meta.tags.sort().join(',')}`;
  }

  private matchesContext(patternContext: Context, searchContext: Context): boolean {
    // Match context type
    if (patternContext.type !== searchContext.type) {
      return false;
    }

    // Match depth (allow more specific patterns)
    if (patternContext.depth < searchContext.depth) {
      return false;
    }

    // Match tags
    const patternTags = new Set(patternContext.meta.tags);
    const searchTags = new Set(searchContext.meta.tags);
    const hasAllTags = [...searchTags].every(tag => patternTags.has(tag));

    return hasAllTags;
  }
}