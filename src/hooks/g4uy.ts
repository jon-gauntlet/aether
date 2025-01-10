import { PatternManager } from './PatternManager';
import { Pattern, Learning, LibraryMeta } from './types';
import { Context } from '../context/types';
import { Energy } from '../energy/types';
import { Flow } from '../flow/types';

const STORAGE_KEY = 'autonomic_patterns';

export class PersistentPatternManager extends PatternManager {
  protected patterns: Pattern[] = [];
  protected meta: LibraryMeta;

  constructor() {
    super();
    this.meta = {
      created: new Date(),
      lastEvolved: new Date(),
      patternCount: 0,
      evolutionCount: 0,
      insights: []
    };
    this.loadPatterns();
  }

  private loadPatterns() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Convert stored dates back to Date objects
        data.patterns.forEach((pattern: Pattern) => {
          pattern.meta.created = new Date(pattern.meta.created);
          pattern.meta.lastUsed = new Date(pattern.meta.lastUsed);
          pattern.meta.learnings.forEach((learning: Learning) => {
            learning.timestamp = new Date(learning.timestamp);
          });
        });
        this.patterns = data.patterns;
        this.meta = {
          ...data.meta,
          created: new Date(data.meta.created),
          lastEvolved: new Date(data.meta.lastEvolved)
        };
      }
    } catch (error) {
      console.error('Error loading patterns:', error);
      // Continue with empty state if load fails
    }
  }

  private savePatterns() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        patterns: this.patterns,
        meta: this.meta
      }));
    } catch (error) {
      console.error('Error saving patterns:', error);
    }
  }

  async applyPattern(context: Context, energy: Energy, flow: Flow): Promise<Pattern | null> {
    const pattern = await super.applyPattern(context, energy, flow);
    this.savePatterns();
    return pattern;
  }

  async recordLearning(pattern: Pattern, context: Context, insight: string): Promise<Pattern> {
    const evolvedPattern = await super.recordLearning(pattern, context, insight);
    this.savePatterns();
    return evolvedPattern;
  }

  getPatternStats() {
    return {
      totalPatterns: this.patterns.length,
      totalLearnings: this.patterns.reduce((sum: number, pattern: Pattern) => 
        sum + pattern.meta.learnings.length, 0),
      averageSuccessRate: this.patterns.reduce((sum: number, pattern: Pattern) => 
        sum + pattern.meta.successRate, 0) / (this.patterns.length || 1),
      mostUsedPattern: this.patterns.reduce((most: Pattern | null, current: Pattern) => 
        current.meta.useCount > (most?.meta.useCount || 0) ? current : most, null),
      recentLearnings: this.patterns
        .flatMap(pattern => pattern.meta.learnings)
        .sort((a: Learning, b: Learning) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10)
    };
  }

  exportPatterns(): string {
    return JSON.stringify({
      patterns: this.patterns,
      meta: this.meta,
      stats: this.getPatternStats()
    }, null, 2);
  }

  async importPatterns(data: string) {
    try {
      const imported = JSON.parse(data);
      if (imported.patterns && Array.isArray(imported.patterns)) {
        // Convert dates in imported data
        imported.patterns.forEach((pattern: Pattern) => {
          pattern.meta.created = new Date(pattern.meta.created);
          pattern.meta.lastUsed = new Date(pattern.meta.lastUsed);
          pattern.meta.learnings.forEach((learning: Learning) => {
            learning.timestamp = new Date(learning.timestamp);
          });
        });
        this.patterns = imported.patterns;
        if (imported.meta) {
          this.meta = {
            ...imported.meta,
            created: new Date(imported.meta.created),
            lastEvolved: new Date(imported.meta.lastEvolved)
          };
        }
        this.savePatterns();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing patterns:', error);
      return false;
    }
  }

  clearPatterns() {
    this.patterns = [];
    this.meta = {
      created: new Date(),
      lastEvolved: new Date(),
      patternCount: 0,
      evolutionCount: 0,
      insights: []
    };
    this.savePatterns();
  }
} 