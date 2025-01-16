import { useState, useEffect, useRef, useCallback } from 'react';
import { Subject, BehaviorSubject } from 'rxjs';
import { map, filter, takeUntil } from 'rxjs/operators';
import { FLOW_STATES } from '../flow/constants';

const DEFAULT_OPTIONS = {
  historySize: 2,
  autoProtect: true,
  minEnergy: 0.3,
  normalizedEnergy: 0.8
};

const normalizeValue = (value, max = 1) => {
  if (value !== undefined && (value < 0 || value > max)) {
    throw new Error('Invalid energy value');
  }
  return value !== undefined ? Math.min(Math.max(value, 0), max) : value;
};

/**
 * Hook for managing flow state
 * @param {string} [id] - Optional flow instance ID
 * @param {Object} [options] - Flow options
 * @returns {Object} Flow state and controls
 */
export const useFlow = (id = crypto.randomUUID(), options = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const isInitialMount = useRef(true);

  const [context, setContext] = useState({
    id,
    metrics: { 
      stability: normalizeValue(1), 
      coherence: normalizeValue(1), 
      resonance: normalizeValue(1), 
      energy: normalizeValue(opts.normalizedEnergy)
    },
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

  // Update streams when context changes
  useEffect(() => {
    // Update streams in correct order when context changes
    subjects.state$.next(context.state);
    subjects.metrics$.next(context.metrics);
    subjects.context$.next(context);
  }, [context]);

  // Handle cleanup
  useEffect(() => {
    return () => {
      subjects.destroy$.next();
      subjects.destroy$.complete();
      subjects.metrics$.complete();
      subjects.state$.complete();
      subjects.context$.complete();
    };
  }, []);

  const validateMetrics = (updates) => {
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && (value < 0 || value > 1)) {
        throw new Error('Invalid energy value');
      }
    });
    return Object.entries(updates).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: normalizeValue(value)
    }), {});
  };

  const updateState = useCallback((newState) => {
    if (!Object.values(FLOW_STATES).includes(newState)) {
      throw new Error('Invalid flow state');
    }
    
    // Update state stream first
    subjects.state$.next(newState);
    
    // Then update context with history
    setContext(prev => {
      const transition = {
        from: prev.state,
        to: newState,
        timestamp: Date.now()
      };
      
      return {
        ...prev,
        state: newState,
        history: {
          ...prev.history,
          transitions: [...prev.history.transitions, transition].slice(-opts.historySize)
        }
      };
    });
  }, [opts.historySize]);

  const updateMetrics = useCallback((updates) => {
    const validatedUpdates = validateMetrics(updates);
    
    // Update metrics stream first
    const newMetrics = {
      ...context.metrics,
      ...validatedUpdates
    };
    subjects.metrics$.next(newMetrics);
    
    // Then update context
    setContext(prev => {
      // Skip state transition on initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return { ...prev, metrics: newMetrics };
      }
      
      // Check if we should transition to FLOW state
      const shouldTransition = newMetrics.energy >= opts.normalizedEnergy && 
                             prev.state === FLOW_STATES.RESTING;
      
      if (shouldTransition) {
        // Update state stream before state change
        subjects.state$.next(FLOW_STATES.FLOW);
        
        const transition = {
          from: prev.state,
          to: FLOW_STATES.FLOW,
          timestamp: Date.now()
        };
        
        return {
          ...prev,
          metrics: newMetrics,
          state: FLOW_STATES.FLOW,
          history: {
            ...prev.history,
            transitions: [...prev.history.transitions, transition].slice(-opts.historySize)
          }
        };
      }
      
      return { ...prev, metrics: newMetrics };
    });
  }, [context.metrics, opts.normalizedEnergy, opts.historySize]);

  const updateProtection = useCallback((updates) => {
    if (updates.level !== undefined && (updates.level < 0 || updates.level > 1)) {
      throw new Error('Invalid protection level');
    }
    
    setContext(prev => ({
      ...prev,
      protection: {
        ...prev.protection,
        ...updates
      }
    }));
  }, []);

  const addPattern = (pattern) => {
    setContext(prev => {
      const patterns = [...prev.history.patterns, pattern].slice(-opts.historySize);
      return {
        ...prev,
        history: { ...prev.history, patterns }
      };
    });
  };

  // Auto-protect on low energy
  useEffect(() => {
    if (opts.autoProtect && context.metrics.energy < opts.minEnergy) {
      updateProtection({ active: true, level: Math.min(context.protection.level + 0.1, 1) });
    }
  }, [context.metrics.energy]);

  // Add a helper to wait for state updates
  const waitForStateUpdate = useCallback((targetState) => {
    return new Promise(resolve => {
      const subscription = subjects.state$.subscribe(state => {
        if (state === targetState) {
          subscription.unsubscribe();
          resolve(state);
        }
      });
    });
  }, []);

  // Add a helper to wait for context updates
  const waitForContextUpdate = useCallback((predicate) => {
    return new Promise(resolve => {
      const subscription = subjects.context$.subscribe(context => {
        if (predicate(context)) {
          subscription.unsubscribe();
          resolve(context);
        }
      });
    });
  }, []);

  return {
    context,
    state$: subjects.state$,
    metrics$: subjects.metrics$,
    context$: subjects.context$,
    updateState,
    updateMetrics,
    updateProtection,
    addPattern,
    waitForStateUpdate,
    waitForContextUpdate
  };
};