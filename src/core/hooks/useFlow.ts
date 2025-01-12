import { useState, useCallback, useRef, useEffect } from 'react';
import { BehaviorSubject } from 'rxjs';
import type { 
  FlowState,
  FlowMetrics,
  Protection,
  NaturalPattern,
  Nullable
} from '../types/base';
import type {
  FlowContext,
  FlowOptions,
  FlowStateUpdate,
  FlowHistory,
  FlowTransition,
  FlowProtection
} from '../types/flow';
import {
  DEFAULT_FLOW_OPTIONS,
  validateFlowContext,
  validateFlowTransition,
  validateFlowHistory,
  validateFlowMetrics,
  validateFlowProtection,
  validateFlowStateUpdate,
  FLOW_STATES
} from '../types/flow';
import {
  filterValidUpdates,
  extractMetrics,
  extractStateChanges,
  combineUpdates,
  handleFlowError
} from '../operators/flowOperators';

const createInitialContext = (id: string): FlowContext => ({
  id,
  type: 'flow',
  timestamp: Date.now(),
  state: FLOW_STATES.RESTING,
  metrics: {
    stability: 0.7,
    coherence: 0.7,
    resonance: 0.7,
    quality: 0.7,
    velocity: 0,
    focus: 0,
    energy: 0,
    intensity: 0,
    conductivity: 0,
    flow: 0
  },
  protection: {
    active: false,
    adaptability: 0.8,
    stability: 0.7,
    integrity: 0.9,
    shields: 0.6,
    resilience: 0.75,
    recovery: 0.8,
    type: 'passive',
    strength: 0.7,
    level: 0.6
  },
  resonance: {
    frequency: 1.618033988749895,
    amplitude: 0.5,
    phase: 0,
    coherence: 0.7,
    harmony: 0.8,
    harmonics: [],
    stability: 0.75
  },
  history: {
    transitions: [],
    patterns: [],
    metrics: {
      averageVelocity: 0,
      averageFocus: 0,
      averageEnergy: 0,
      peakPerformance: 0,
      sustainedFlowTime: 0
    }
  },
  patterns: []
});

export function useFlow(id: string = crypto.randomUUID(), options: Partial<FlowOptions> = {}) {
  const [context, setContext] = useState<FlowContext>(() => validateFlowContext(createInitialContext(id)));
  const updates$ = useRef(new BehaviorSubject<Nullable<FlowStateUpdate>>(null));
  const opts = { ...DEFAULT_FLOW_OPTIONS, ...options };

  // Create derived streams
  const metrics$ = updates$.current.pipe(
    filterValidUpdates(),
    extractMetrics(),
    handleFlowError(context.metrics)
  );

  const state$ = updates$.current.pipe(
    filterValidUpdates(),
    extractStateChanges(),
    handleFlowError(context.state)
  );

  const context$ = updates$.current.pipe(
    filterValidUpdates(),
    combineUpdates(context),
    handleFlowError(context)
  );

  const updateMetrics = useCallback((newMetrics: Partial<FlowMetrics>) => {
    const updatedMetrics = validateFlowMetrics({
      ...context.metrics,
      ...newMetrics
    });

    const update = validateFlowStateUpdate({
      type: 'metrics',
      payload: { metrics: updatedMetrics },
      timestamp: Date.now()
    });

    setContext(prev => validateFlowContext({
      ...prev,
      metrics: updatedMetrics,
      timestamp: update.timestamp
    }));
    
    updates$.current.next(update);
  }, [context.metrics]);

  const transitionTo = useCallback((newState: FlowState, reason?: string) => {
    setContext(prev => {
      const transition = validateFlowTransition({
        from: prev.state,
        to: newState,
        timestamp: Date.now(),
        metrics: prev.metrics,
        reason
      });

      const newHistory = validateFlowHistory({
        ...prev.history,
        transitions: [...prev.history.transitions, transition].slice(-opts.historySize!),
        metrics: {
          ...prev.history.metrics,
          sustainedFlowTime: newState === FLOW_STATES.FLOW ? 
            prev.history.metrics.sustainedFlowTime + 1 : 
            prev.history.metrics.sustainedFlowTime
        }
      });

      return validateFlowContext({
        ...prev,
        state: newState,
        history: newHistory,
        timestamp: transition.timestamp
      });
    });

    const update = validateFlowStateUpdate({
      type: 'state',
      payload: { state: newState },
      timestamp: Date.now()
    });

    updates$.current.next(update);
  }, [opts.historySize]);

  const updateProtection = useCallback((protectionUpdate: Partial<Protection>) => {
    const updatedProtection = validateFlowProtection({
      ...context.protection,
      ...protectionUpdate
    });

    const update = validateFlowStateUpdate({
      type: 'protection',
      payload: { protection: updatedProtection },
      timestamp: Date.now()
    });

    setContext(prev => validateFlowContext({
      ...prev,
      protection: updatedProtection,
      timestamp: update.timestamp
    }));

    updates$.current.next(update);
  }, [context.protection]);

  const addPattern = useCallback((pattern: NaturalPattern) => {
    const update = validateFlowStateUpdate({
      type: 'pattern',
      payload: { patterns: [pattern] },
      timestamp: Date.now()
    });

    setContext(prev => validateFlowContext({
      ...prev,
      patterns: [...prev.patterns, pattern].slice(-opts.historySize!),
      timestamp: update.timestamp
    }));

    updates$.current.next(update);
  }, [opts.historySize]);

  useEffect(() => {
    if (opts.autoProtect) {
      const checkProtection = () => {
        const { metrics, protection } = context;
        if (metrics.energy < opts.recoveryThreshold! && !protection.active) {
          updateProtection({
            active: true,
            recovery: Math.max(protection.recovery, 0.8)
          });
          transitionTo(FLOW_STATES.RECOVERING, 'Energy below threshold');
        }
      };

      const interval = setInterval(checkProtection, opts.metricsUpdateInterval);
      return () => clearInterval(interval);
    }
  }, [context, opts, updateProtection, transitionTo]);

  return {
    context,
    metrics$,
    state$,
    context$,
    updateMetrics,
    transitionTo,
    updateProtection,
    addPattern,
    updates$: updates$.current.asObservable()
  };
} 