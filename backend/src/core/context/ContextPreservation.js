import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { Pattern } from '../patterns/PatternRecognition';
import { FlowState, FlowMetrics } from '../flow/NaturalFlow';

/**
 * @typedef {Object} ContextStat
 * @property {number} depth - Context depth level
 * @property {number} presence - Context presence strength
 * @property {Object.<string, any>} [key] - Additional dynamic properties
 */

/**
 * Class for managing context preservation
 */
export class ContextPreservationImpl {
  constructor() {
    this.stats$ = new BehaviorSubject({});
    this.protection$ = new BehaviorSubject({});
  }

  /**
   * Calculate context depth
   * @private
   * @param {FlowState} state
   * @param {FlowMetrics} metrics
   * @returns {number}
   */
  calculateDepth(state, metrics) {
    return Math.min(
      state.depth || 0,
      metrics.maxDepth || 10
    );
  }

  /**
   * Calculate context presence
   * @private
   * @param {Pattern[]} patterns
   * @returns {number}
   */
  calculatePresence(patterns) {
    return patterns.reduce((sum, pattern) => 
      sum + (pattern.strength || 0), 0
    );
  }

  /**
   * Observe context protection status
   * @public
   * @returns {Observable<Object>}
   */
  observeProtection() {
    return this.protection$.pipe(
      debounceTime(100),
      map(protection => ({
        ...protection,
        timestamp: Date.now()
      }))
    );
  }
}