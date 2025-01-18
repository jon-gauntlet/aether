import { Pattern, Learning, LibraryMeta } from './types';
import { Context } from '../context/types';
import { v4 as uuidv4 } from 'uuid';
import { SystemIndex } from '../index/types';

/**
 * @typedef {Object} AutonomicPatternLibrary
 * @property {Function} addPattern - Add a pattern to the library
 * @property {Function} evolvePattern - Evolve an existing pattern
 * @property {Function} generateIndexKey - Generate a key for indexing patterns
 * @property {Function} matchesContext - Check if pattern matches context
 */

/**
 * Implementation of the Autonomic Pattern Library
 * @implements {AutonomicPatternLibrary}
 */
export class AutonomicPatternLibraryImpl {
  constructor() {
    this.patterns = [];
    this.index = new Map();
  }

  /**
   * Add a pattern to the library
   * @param {Pattern} pattern 
   * @returns {Pattern[]}
   */
  addPattern(pattern) {
    this.patterns.push(pattern);
    this.indexPattern(pattern);
    return this.patterns.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Evolve an existing pattern
   * @param {Pattern} pattern
   * @param {Learning} learning
   */
  evolvePattern(pattern, learning) {
    if (learning.insight) {
      const existingIndex = this.patterns.findIndex(p => p.id === pattern.id);
      if (existingIndex >= 0) {
        this.patterns[existingIndex] = {
          ...pattern,
          strength: pattern.strength + learning.insight
        };
      }
    }
  }

  /**
   * Generate a key for indexing patterns
   * @private
   * @param {Pattern} pattern
   * @returns {string}
   */
  generateIndexKey(pattern) {
    return `${pattern.type}_${pattern.context.id}`;
  }

  /**
   * Check if pattern matches context
   * @private
   * @param {Pattern} pattern
   * @param {Context} context
   * @returns {boolean}
   */
  matchesContext(pattern, context) {
    if (!pattern.context || !context) {
      return false;
    }

    // Match depth (allow more specific patterns)
    if (pattern.context.depth > context.depth) {
      return false;
    }

    // Match tags
    const hasAllTags = pattern.context.tags.every(tag => 
      context.tags.includes(tag)
    );

    return hasAllTags;
  }
}