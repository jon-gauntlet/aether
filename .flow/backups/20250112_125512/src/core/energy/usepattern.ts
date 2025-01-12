import { useEffect, useState, useCallback } from 'react';
import { Pattern } from './types';
import { Context } from '../context/types';
import { Energy } from '../energy/types';
import { Flow } from '../flow/types';
import { PatternManager } from './PatternManager';

// Singleton pattern manager
const patternManager = new PatternManager();

export function usePattern(context: Context, energy: Energy, flow: Flow) {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load pattern
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    patternManager.applyPattern(context, energy, flow)
      .then(result => {
        if (mounted) {
          setPattern(result);
          setError(null);
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
      const evolvedPattern = await patternManager.recordLearning(
        pattern,
        context,
        insight
      );
      setPattern(evolvedPattern);
      return evolvedPattern;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [pattern, context]);

  // Get active pattern
  const getActivePattern = useCallback(() => {
    return patternManager.getActivePattern(context.id);
  }, [context.id]);

  // Get context history
  const getContextHistory = useCallback(() => {
    return patternManager.getContextHistory();
  }, []);

  return {
    pattern,
    isLoading,
    error,
    recordLearning,
    getActivePattern,
    getContextHistory
  };
} 