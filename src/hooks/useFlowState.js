import { useState, useCallback } from 'react'

/**
 * @typedef {Object} FlowState
 * @property {boolean} active - Whether flow is active
 * @property {number} focus - Focus level (0-1)
 * @property {number} momentum - Momentum level (0-1)
 * @property {number} quality - Flow quality (0-1)
 */

/**
 * @typedef {Object} FlowMetrics
 * @property {number} duration - Flow duration in seconds
 * @property {number} interruptions - Number of interruptions
 * @property {number} recoveryTime - Time spent recovering in seconds
 * @property {number} peakDuration - Time spent in peak flow in seconds
 */

/**
 * Hook for managing flow state
 * @returns {[FlowState, Function, FlowMetrics]} Flow state, update function and metrics
 */
const useFlowState = () => {
  const [state, setState] = useState({
    active: false,
    protection: true,
    metrics: {
      duration: 0,
      interruptions: 0,
      recoveryTime: 0,
      peakDuration: 0
    },
    focus: 0.8,
    momentum: 0.7,
    quality: 0.9
  })

  /**
   * Update flow state
   * @param {Partial<FlowState>} updates - State updates to apply
   */
  const updateState = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      ...updates,
      metrics: {
        ...prev.metrics,
        duration: prev.active ? prev.metrics.duration + 1 : prev.metrics.duration
      }
    }))
  }, [])

  /**
   * Update flow metrics
   * @param {Partial<FlowMetrics>} updates - Metrics updates to apply
   */
  const updateMetrics = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        ...updates
      }
    }))
  }, [])

  return [state, updateState, updateMetrics]
}

export default useFlowState 