/**
 * @typedef {'FOCUS' | 'HYPERFOCUS' | 'RECOVERING' | 'RESTING' | 'EXHAUSTED'} FlowStateType
 * @typedef {'low' | 'medium' | 'high' | 'peak'} FlowIntensity
 * 
 * @typedef {Object} FlowMetrics
 * @property {number} velocity
 * @property {number} momentum
 * @property {number} resistance
 * @property {number} conductivity
 * @property {number} focus
 * @property {number} energy
 * @property {number} clarity
 * @property {number} quality
 * 
 * @typedef {Object} FlowState
 * @property {boolean} active
 * @property {FlowStateType} type
 * @property {FlowIntensity} intensity
 * @property {number} duration
 * @property {FlowMetrics} metrics
 * @property {number} lastTransition
 * @property {boolean} protected
 * @property {number} quality
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { DEFAULT_FLOW_METRICS, calculateFlowQuality } from '../types/flow/metrics';
import { useProtection } from './useProtection';

const FLOW_THRESHOLDS = {
  low: 0.7,
  medium: 0.7,
  high: 0.9,
  peak: 0.95
};

export const useFlowState = () => {
  const { protection, checkHealth } = useProtection();
  const [flowState, setFlowState] = useState({
    active: false,
    type: 'RESTING',
    intensity: 'medium',
    duration: 0,
    metrics: DEFAULT_FLOW_METRICS,
    lastTransition: Date.now(),
    protected: false,
    quality: 0.8
  });

  const flowTimer = useRef();
  const metricsTimer = useRef();

  const updateMetrics = useCallback(() => {
    const timeSinceTransition = Date.now() - flowState.lastTransition;
    const hoursPassed = timeSinceTransition / (60 * 60 * 1000);
    
    if (flowState.active) {
      setFlowState(prev => {
        const updatedMetrics = {
          velocity: Math.min(1, prev.metrics.velocity + 0.1),
          momentum: Math.min(1, prev.metrics.momentum + 0.1),
          resistance: Math.max(0, prev.metrics.resistance - 0.1),
          conductivity: Math.min(1, prev.metrics.conductivity + 0.1),
          focus: Math.min(1, prev.metrics.focus + 0.1),
          energy: Math.min(1, prev.metrics.energy + 0.1),
          clarity: Math.min(1, prev.metrics.clarity + 0.1),
          quality: prev.metrics.quality
        };

        // Calculate new quality
        updatedMetrics.quality = calculateFlowQuality(updatedMetrics);

        // Determine flow state type based on metrics
        let type = prev.type;
        const avgMetrics = (
          updatedMetrics.velocity +
          updatedMetrics.momentum +
          (1 - updatedMetrics.resistance) +
          updatedMetrics.conductivity +
          updatedMetrics.focus +
          updatedMetrics.energy +
          updatedMetrics.clarity
        ) / 7;

        if (avgMetrics >= FLOW_THRESHOLDS.peak) {
          type = 'HYPERFOCUS';
        } else if (avgMetrics >= FLOW_THRESHOLDS.high) {
          type = 'FOCUS';
        } else if (avgMetrics >= FLOW_THRESHOLDS.medium) {
          type = 'FOCUS';
        } else if (avgMetrics < FLOW_THRESHOLDS.low) {
          type = 'EXHAUSTED';
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
        type: 'FOCUS',
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
      type: 'RECOVERING',
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