import { useState, useEffect, useRef } from 'react';
import { Subject, BehaviorSubject } from 'rxjs';
import { map, filter, takeUntil } from 'rxjs/operators';
import { FLOW_STATES } from '../flow/constants';

const DEFAULT_OPTIONS = {
  historySize: 100,
  autoProtect: true,
  minEnergy: 0.3
};

/**
 * Hook for managing flow state
 * @param {string} [id] - Optional flow instance ID
 * @param {Object} [options] - Flow options
 * @returns {Object} Flow state and controls
 */
export const useFlow = (id = crypto.randomUUID(), options = {}) => {
  const [context, setContext] = useState({
    id,
    metrics: { stability: 1, coherence: 1, resonance: 1 },
    protection: { level: 1, active: true },
    history: { transitions: [], patterns: [], metrics: [] },
    state: FLOW_STATES.RESTING
  });

  const subjects = useRef({
    metrics$: new BehaviorSubject(context.metrics),
    state$: new BehaviorSubject(context.state),
    context$: new BehaviorSubject(context),
    destroy$: new Subject()
  }).current;

  const opts = { ...DEFAULT_OPTIONS, ...options };

  useEffect(() => {
    // Update context$ when context changes
    subjects.context$.next(context);
  }, [context]);

  useEffect(() => {
    return () => {
      // Cleanup subscriptions
      subjects.destroy$.next();
      subjects.destroy$.complete();
      subjects.metrics$.complete();
      subjects.state$.complete();
      subjects.context$.complete();
    };
  }, []);

  const updateMetrics = (metrics) => {
    if (metrics.energy < 0 || metrics.energy > 1) {
      throw new Error('Invalid metric value');
    }
    
    setContext(prev => {
      const newMetrics = { ...prev.metrics, ...metrics };
      subjects.metrics$.next(newMetrics);
      return {
        ...prev,
        metrics: newMetrics
      };
    });
  };

  const updateState = (state) => {
    setContext(prev => {
      subjects.state$.next(state);
      return {
        ...prev,
        state: { ...prev.state, ...state }
      };
    });
  };

  const addPattern = (pattern) => {
    setContext(prev => {
      const patterns = [...prev.history.patterns, pattern]
        .slice(-opts.historySize);
      return {
        ...prev,
        history: { ...prev.history, patterns }
      };
    });
  };

  const updateProtection = (protection) => {
    setContext(prev => ({
      ...prev,
      protection: { ...prev.protection, ...protection }
    }));
  };

  // Auto-protect on low energy
  useEffect(() => {
    if (opts.autoProtect && context.metrics.energy < opts.minEnergy) {
      updateProtection({ active: true, level: Math.min(context.protection.level + 0.1, 1) });
    }
  }, [context.metrics.energy]);

  return {
    context,
    metrics$: subjects.metrics$.asObservable().pipe(takeUntil(subjects.destroy$)),
    state$: subjects.state$.asObservable().pipe(takeUntil(subjects.destroy$)),
    context$: subjects.context$.asObservable().pipe(takeUntil(subjects.destroy$)),
    updateMetrics,
    updateState,
    addPattern,
    updateProtection
  };
};