/**
 * @typedef {Object} FlowMetrics
 * @property {number} focus
 * @property {number} energy
 * @property {number} clarity
 * @property {number} velocity
 * @property {number} momentum
 * @property {number} resistance
 * @property {number} conductivity
 * @property {number} quality
 */

/**
 * @typedef {Object} FlowState
 * @property {boolean} active
 * @property {string} type
 * @property {string} intensity
 * @property {FlowMetrics} metrics
 * @property {number} duration
 * @property {number} lastTransition
 * @property {boolean} protected
 * @property {number} quality
 */

/**
 * @typedef {Object} SpaceState
 * @property {string} type
 * @property {boolean} active
 * @property {FlowState} flowState
 * @property {ProtectionState} protection
 * @property {number} lastTransition
 */

/**
 * @typedef {Object} PreservedState
 * @property {number} timestamp
 * @property {FlowState} flowState
 * @property {SpaceState} spaceState
 * @property {ProtectionState} protection
 * @property {Object} metrics
 * @property {number} metrics.coherence
 * @property {number} metrics.stability
 * @property {number} metrics.efficiency
 */

/**
 * @typedef {Object} StateBackup
 * @property {PreservedState[]} states
 * @property {number} lastBackup
 * @property {number[]} recoveryPoints
 */

import { useState, useCallback, useEffect } from 'react';

const BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_BACKUPS = 12; // 1 hour of backups
const COHERENCE_THRESHOLD = 0.95;
const STABILITY_THRESHOLD = 0.95;

/**
 * Hook for managing state preservation
 * @returns {Object} State preservation methods
 */
export const useStatePreservation = () => {
  const [stateBackup, setStateBackup] = useState({
    states: [],
    lastBackup: Date.now(),
    recoveryPoints: []
  });

  /**
   * Preserve current state
   * @param {FlowState} flowState - Current flow state
   * @param {SpaceState} spaceState - Current space state
   * @param {ProtectionState} protection - Current protection state
   * @returns {boolean} Whether state was preserved
   */
  const preserveState = useCallback((flowState, spaceState, protection) => {
    // Calculate state coherence using only positive metrics
    const coherence = Object.entries(flowState.metrics)
      .filter(([key, val]) => key !== 'resistance')
      .reduce((sum, [_, val]) => sum + val, 0) / 
      (Object.keys(flowState.metrics).length - 1); // Subtract 1 for resistance
    
    // Calculate system stability
    const stability = Object.values(protection.metrics).reduce((sum, val) => sum + val, 0) /
      Object.values(protection.metrics).length;

    // Only preserve high-quality states
    if (coherence >= COHERENCE_THRESHOLD && stability >= STABILITY_THRESHOLD) {
      const now = Date.now();
      const newState = {
        timestamp: now,
        flowState,
        spaceState,
        protection: {
          active: protection.active,
          metrics: protection.metrics,
          lastCheck: now,
          violations: protection.violations,
          flowShieldActive: protection.flowShieldActive || false
        },
        metrics: {
          coherence,
          stability,
          efficiency: (coherence + stability) / 2
        }
      };

      setStateBackup(prev => {
        const states = [newState, ...prev.states].slice(0, MAX_BACKUPS);
        const recoveryPoints = states
          .filter(state => state.metrics.coherence >= COHERENCE_THRESHOLD)
          .map(state => state.timestamp);

        return {
          states,
          lastBackup: now,
          recoveryPoints
        };
      });

      return true;
    }

    return false;
  }, []);

  /**
   * Restore state from a recovery point
   * @param {number} [timestamp] - Timestamp of state to restore
   * @returns {PreservedState|null} Restored state or null
   */
  const restoreState = useCallback((timestamp) => {
    const targetTime = timestamp || stateBackup.states[0]?.timestamp;
    if (!targetTime) return null;

    const state = stateBackup.states.find(s => s.timestamp === targetTime);
    if (!state) return null;

    return state;
  }, [stateBackup.states]);

  /**
   * Get available recovery points
   * @returns {number[]} Array of recovery point timestamps
   */
  const getRecoveryPoints = useCallback(() => {
    return stateBackup.recoveryPoints;
  }, [stateBackup.recoveryPoints]);

  return {
    preserveState,
    restoreState,
    getRecoveryPoints
  };
}; 