import { useState, useCallback, useEffect, useRef } from 'react';
import { FlowStateType } from '../types/flow/types';
import type { FlowState, FlowIntensity } from '../types/flow/types';
import { DEFAULT_FLOW_METRICS, calculateFlowQuality } from '../types/flow/metrics';
import type { FlowMetrics } from '../types/flow/metrics';
import { useProtection } from './useProtection';

const FLOW_THRESHOLDS = {
  low: 0.7,
  medium: 0.8,
  high: 0.9,
  peak: 0.95
};

export const useFlowState = () => {
  const { protection, checkHealth } = useProtection();
  const [flowState, setFlowState] = useState<FlowState>({
    active: false,
    type: FlowStateType.FOCUS,
    intensity: 'medium',
    duration: 0,
    metrics: DEFAULT_FLOW_METRICS,
    lastTransition: Date.now(),
    protected: false,
    quality: 0.8
  });

  const flowTimer = useRef<NodeJS.Timeout>();
  const metricsTimer = useRef<NodeJS.Timeout>();

  const updateMetrics = useCallback(() => {
    const timeSinceTransition = Date.now() - flowState.lastTransition;
    const hoursPassed = timeSinceTransition / (60 * 60 * 1000);
    
    if (flowState.active) {
      setFlowState(prev => {
        const updatedMetrics: FlowMetrics = {
          velocity: Math.min(1, prev.metrics.velocity + 0.05),
          momentum: Math.min(1, prev.metrics.momentum + 0.06),
          resistance: Math.max(0, prev.metrics.resistance - 0.04),
          conductivity: Math.min(1, prev.metrics.conductivity + 0.05),
          focus: Math.min(1, prev.metrics.focus + 0.05),
          energy: Math.min(1, prev.metrics.energy + 0.03),
          clarity: Math.min(1, prev.metrics.clarity + 0.04),
          quality: prev.metrics.quality
        };

        // Calculate new quality
        updatedMetrics.quality = calculateFlowQuality(updatedMetrics);

        // Determine flow state type based on metrics
        let type = prev.type;
        const avgMetrics = Object.values(updatedMetrics).reduce((sum, val) => sum + val, 0) / 
          Object.values(updatedMetrics).length;

        if (avgMetrics >= FLOW_THRESHOLDS.peak) {
          type = FlowStateType.HYPERFOCUS;
        } else if (avgMetrics >= FLOW_THRESHOLDS.high) {
          type = FlowStateType.FLOW;
        } else if (avgMetrics >= FLOW_THRESHOLDS.medium) {
          type = FlowStateType.FOCUS;
        } else if (avgMetrics < FLOW_THRESHOLDS.low) {
          type = FlowStateType.EXHAUSTED;
        }

        return {
          ...prev,
          type,
          metrics: updatedMetrics,
          quality: updatedMetrics.quality
        };
      });
    }
  }, [flowState.active, flowState.lastTransition]);

  const startFlow = useCallback(async () => {
    const healthCheck = checkHealth();
    if (Object.values(healthCheck).every(metric => metric >= FLOW_THRESHOLDS.medium)) {
      setFlowState(prev => ({
        ...prev,
        active: true,
        type: FlowStateType.FOCUS,
        lastTransition: Date.now(),
        protected: true
      }));

      // Start flow timer
      flowTimer.current = setInterval(() => {
        setFlowState(prev => ({
          ...prev,
          duration: prev.duration + 1000
        }));
      }, 1000);

      // Start metrics update timer
      metricsTimer.current = setInterval(updateMetrics, 5 * 60 * 1000);

      return true;
    }
    return false;
  }, [checkHealth, updateMetrics]);

  const endFlow = useCallback(() => {
    if (flowTimer.current) {
      clearInterval(flowTimer.current);
    }
    if (metricsTimer.current) {
      clearInterval(metricsTimer.current);
    }

    setFlowState(prev => ({
      ...prev,
      active: false,
      type: FlowStateType.RECOVERING,
      protected: false,
      lastTransition: Date.now()
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flowTimer.current) {
        clearInterval(flowTimer.current);
      }
      if (metricsTimer.current) {
        clearInterval(metricsTimer.current);
      }
    };
  }, []);

  return {
    flowState,
    startFlow,
    endFlow,
    updateMetrics
  };
}; 