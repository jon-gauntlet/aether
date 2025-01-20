import { PersistentPatternManager } from './PersistentPatternManager';
import { Pattern } from './types';
import { Context } from '../context/types';
import { Energy } from '../energy/types';
import { Flow } from '../flow/types';

/**
 * @typedef {Object} PatternStats
 * @property {Object.<string, any>} [key] - Dynamic key-value pairs
 */

// Singleton manager instance
let persistentManager = null;

/**
 * Get pattern statistics
 * @param {Pattern} pattern
 * @returns {Promise<PatternStats>}
 */
export async function getPatternStats(pattern) {
  try {
    const stats = await persistentManager.getStats(pattern);
    return stats;
  } catch (err) {
    console.error('Error getting pattern stats:', err);
    return {};
  }
}

export const PatternStats = {};