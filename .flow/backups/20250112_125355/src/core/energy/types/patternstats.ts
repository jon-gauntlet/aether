import { useState, useEffect, useCallback } from 'react';
import { PersistentPatternManager } from './PersistentPatternManager';
import { Pattern } from './types';
import { Context } from '../context/types';
import { Energy } from '../energy/types';
import { Flow } from '../flow/types';

// Singleton manager instance
const persistentManager = new PersistentPatternManager();

export interface PatternStats {
  totalPatterns: number;
  totalLearnings: number;
  averageSuccessRate: number;
  mostUsedPattern: Pattern | null;
  recentLearnings: any[];
}

export function usePersistentPattern(context: Context, energy: Energy, flow: Flow) {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<PatternStats | null>(null);

  // Load pattern
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    persistentManager.applyPattern(context, energy, flow)
      .then(result => {
        if (mounted) {
          setPattern(result);
          setError(null);
          setStats(persistentManager.getPatternStats());
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          setPattern(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [context.id, energy.type, flow.state]);

  // Record learning
  const recordLearning = useCallback(async (insight: string) => {
    if (!pattern) {
      throw new Error('No active pattern to record learning for');
    }

    try {
      const evolvedPattern = await persistentManager.recordLearning(
        pattern,
        context,
        insight
      );
      setPattern(evolvedPattern);
      setStats(persistentManager.getPatternStats());
      return evolvedPattern;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [pattern, context]);

  // Export patterns
  const exportPatterns = useCallback(() => {
    return persistentManager.exportPatterns();
  }, []);

  // Import patterns
  const importPatterns = useCallback(async (data: string) => {
    try {
      const success = await persistentManager.importPatterns(data);
      if (success) {
        setStats(persistentManager.getPatternStats());
      }
      return success;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, []);

  // Clear patterns
  const clearPatterns = useCallback(() => {
    persistentManager.clearPatterns();
    setPattern(null);
    setStats(persistentManager.getPatternStats());
  }, []);

  // Get active pattern
  const getActivePattern = useCallback(() => {
    return pattern;
  }, [pattern]);

  // Get context history
  const getContextHistory = useCallback(() => {
    return persistentManager.getContextHistory();
  }, []);

  // Get pattern stats
  const getStats = useCallback(() => {
    return stats;
  }, [stats]);

  return {
    pattern,
    isLoading,
    error,
    stats,
    actions: {
      recordLearning,
      exportPatterns,
      importPatterns,
      clearPatterns
    },
    getters: {
      getActivePattern,
      getContextHistory,
      getStats
    }
  };
} 