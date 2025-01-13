import { useState, useEffect, useCallback } from 'react';
import { Energy, EnergyType, FlowState } from './types';

const ENERGY_DECAY_RATE = 0.1; // Energy points lost per minute
const FLOW_BONUS_MULTIPLIER = 1.5; // Energy bonus in flow state
const RECOVERY_RATE = 0.2; // Energy points gained per minute during rest

/**
 * Hook to manage energy levels and flow states
 * @param {EnergyType} [initialType=EnergyType.Mental] - Initial energy type
 * @returns {Object} Energy state and management functions
 */
export function useEnergy(initialType = EnergyType.Mental) {
  const [energy, setEnergy] = useState({
    current: 100,
    max: 100,
    type: initialType,
    flow: FlowState.Normal,
    meta: {
      timestamp: new Date(),
      duration: 0,
      source: 'initialization',
      triggers: [],
      notes: ''
    }
  });

  /**
   * Update energy level
   * @param {number} amount - Amount to change energy by
   * @param {string} [source='manual'] - Source of energy change
   * @param {string} [notes=''] - Additional notes
   */
  const updateEnergy = useCallback((amount, source = 'manual', notes = '') => {
    setEnergy(prev => {
      const newCurrent = Math.max(0, Math.min(prev.max, prev.current + amount));
      const newFlow = amount > 0 && prev.flow === FlowState.Normal ? FlowState.Flow : prev.flow;
      
      return {
        ...prev,
        current: newCurrent,
        flow: newFlow,
        meta: {
          ...prev.meta,
          timestamp: new Date(),
          source,
          notes
        }
      };
    });
  }, []);

  /**
   * Set flow state
   * @param {FlowState} state - New flow state
   * @param {string} [notes=''] - Additional notes
   */
  const setFlowState = useCallback((state, notes = '') => {
    setEnergy(prev => ({
      ...prev,
      flow: state,
      meta: {
        ...prev.meta,
        timestamp: new Date(),
        notes
      }
    }));
  }, []);

  // Track energy decay
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(current => {
        const decayRate = current.flow === FlowState.Flow
          ? ENERGY_DECAY_RATE / FLOW_BONUS_MULTIPLIER
          : ENERGY_DECAY_RATE;

        return {
          ...current,
          current: Math.max(0, current.current - decayRate),
          meta: {
            ...current.meta,
            duration: current.meta.duration + 1
          }
        };
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  /**
   * Enter flow state
   * @param {string} trigger - What triggered the flow state
   */
  const enterFlow = useCallback((trigger) => {
    setEnergy(current => ({
      ...current,
      flow: FlowState.Flow,
      meta: {
        ...current.meta,
        triggers: [...current.meta.triggers, trigger],
        timestamp: new Date()
      }
    }));
  }, []);

  /**
   * Exit flow state
   * @param {string} reason - Reason for exiting flow state
   */
  const exitFlow = useCallback((reason) => {
    setEnergy(current => ({
      ...current,
      flow: FlowState.Normal,
      meta: {
        ...current.meta,
        notes: `${current.meta.notes}\nFlow exit: ${reason}`,
        timestamp: new Date()
      }
    }));
  }, []);

  /**
   * Rest to recover energy
   * @param {number} duration - Duration to rest in seconds
   * @returns {Promise<void>}
   */
  const rest = useCallback(async (duration) => {
    return new Promise(resolve => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (elapsed >= duration) {
          clearInterval(interval);
          resolve();
        }

        setEnergy(current => ({
          ...current,
          current: Math.min(current.max, current.current + RECOVERY_RATE),
          meta: {
            ...current.meta,
            notes: `${current.meta.notes}\nResting: ${Math.floor(elapsed)}s`,
            timestamp: new Date()
          }
        }));
      }, 1000);
    });
  }, []);

  /**
   * Boost energy temporarily
   * @param {number} amount - Amount to boost energy by
   * @param {string} source - Source of the energy boost
   */
  const boost = useCallback((amount, source) => {
    setEnergy(current => ({
      ...current,
      current: Math.min(current.max, current.current + amount),
      meta: {
        ...current.meta,
        source,
        timestamp: new Date()
      }
    }));
  }, []);

  return {
    energy,
    enterFlow,
    exitFlow,
    rest,
    boost,
    isLow: energy.current < 30,
    isCritical: energy.current < 10,
    inFlow: energy.flow === FlowState.Flow
  };
} 