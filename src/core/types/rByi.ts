import { Pattern, PatternLibrary, LibraryMeta, Learning } from './types';
import { Context } from '../context/types';
import { v4 as uuidv4 } from 'uuid';

export class AutonomicPatternLibrary implements PatternLibrary {
  patterns: Pattern[] = [];
  meta: LibraryMeta;

  constructor() {
    this.meta = {
      created: new Date(),
      lastEvolved: new Date(),
      patternCount: 0,
      evolutionCount: 0,
      insights: []
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
    return this.patterns.filter(pattern => this.matchesContext(pattern.context, context))
      .sort((a, b) => {
        // Sort by success rate and use count
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

    // Replace old pattern
    const index = this.patterns.findIndex(p => p.id === pattern.id);
    if (index >= 0) {
      this.patterns[index] = evolvedPattern;
    }

    return evolvedPattern;
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