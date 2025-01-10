import { Pattern, PatternLibrary, LibraryMeta, Learning } from './types';
import { Context } from '../context/types';
import { v4 as uuidv4 } from 'uuid';

export class AutonomicPatternLibrary implements PatternLibrary {
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
  }

  findPattern(context: Context): Pattern[] {
    //First check indexed patterns
    const indexKey = this.generateIndexKey(context);
    const indexedResults = this.indexedPatterns.get(indexKey) || [];
    
    // Combine with traditional search
    const standardResults = this.patterns.filter(pattern => 
      this.matchesContext(pattern.context, context, true)
    );

    return [...new Set([...indexedResults, ...standardResults])]
      .sort((a, b) => {
        const aScore = this.calculatePatternScore(a);
        const bScore = this.calculatePatternScore(b);
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

    // Replace old pattern
    const index = this.patterns.findIndex(p => p.id === pattern.id);
    if (index >= 0) {
      this.patterns[index] = evolvedPattern;
    }

    return evolvedPattern;
  }

  private calculatePatternScore(pattern: Pattern):number {
    return pattern.meta.successRate * 
           Math.log(pattern.meta.useCount + 1) * 
           (pattern.meta.energyEfficiency || 1);
  }

  private generateIndexKey(context: Context): string {
    return `${context.type}:${context.depth}:${context.meta.tags.sort().join(',')}`;
  }

  private matchesContext(
    patternContext: Context, 
    searchContext: Context,
    checkEnergyFlow: boolean = false
  ): boolean {
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

    // Add energy flow validation
    if (checkEnergyFlow&& 
        patternContext.meta.energyFlow && 
        searchContext.meta.energyFlow) {
      return patternContext.meta.energyFlow >= searchContext.meta.energyFlow;
    }

    return hasAllTags;
  }
}