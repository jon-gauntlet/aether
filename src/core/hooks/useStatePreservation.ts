import { useState, useCallback, useEffect } from 'react';
import { FlowState, FlowMetrics } from '../types/flow/types';
import { SpaceState } from '../types/space/types';
import { ProtectionState } from '../types/protection/protection';

interface PreservedState {
  timestamp: number;
  flowState: FlowState;
  spaceState: SpaceState;
  protection: ProtectionState;
  metrics: {
    coherence: number;
    stability: number;
    efficiency: number;
  };
}

interface StateBackup {
  states: PreservedState[];
  lastBackup: number;
  recoveryPoints: number[];
}

const BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_BACKUPS = 12; // 1 hour of backups
const COHERENCE_THRESHOLD = 0.98;
const STABILITY_THRESHOLD = 0.95;

export const useStatePreservation = () => {
  const [stateBackup, setStateBackup] = useState<StateBackup>({
    states: [],
    lastBackup: Date.now(),
    recoveryPoints: []
  });

  const preserveState = useCallback((
    flowState: FlowState,
    spaceState: SpaceState,
    protection: ProtectionState
  ): boolean => {
    // Calculate state coherence
    const coherence = Object.values(flowState.metrics).reduce((sum, val) => sum + val, 0) / 
      Object.values(flowState.metrics).length;
    
    // Calculate system stability
    const stability = Object.values(protection.metrics).reduce((sum, val) => sum + val, 0) /
      Object.values(protection.metrics).length;

    // Only preserve high-quality states
    if (coherence >= COHERENCE_THRESHOLD && stability >= STABILITY_THRESHOLD) {
      const now = Date.now();
      const newState: PreservedState = {
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

  const restoreState = useCallback((timestamp?: number): PreservedState | null => {
    const targetTime = timestamp || stateBackup.states[0]?.timestamp;
    if (!targetTime) return null;

    const state = stateBackup.states.find(s => s.timestamp === targetTime);
    if (!state) return null;

    return state;
  }, [stateBackup.states]);

  const getRecoveryPoints = useCallback((): number[] => {
    return stateBackup.recoveryPoints;
  }, [stateBackup.recoveryPoints]);

  return {
    preserveState,
    restoreState,
    getRecoveryPoints
  };
}; 