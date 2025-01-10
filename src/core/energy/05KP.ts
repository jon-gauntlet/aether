import { useState, useEffect, useCallback } from 'react';
import { Energy, EnergyType, FlowState } from './types';

const ENERGY_DECAY_RATE = 0.1; // Energy points lost per minute
const FLOW_BONUS_MULTIPLIER = 1.5; // Energy bonus in flow state
const RECOVERY_RATE = 0.2; // Energy points gained per minute during rest

export function useEnergy(initialType: EnergyType = EnergyType.Mental) {
  const [energy, setEnergy] = useState<Energy>({
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

  // Enter flow state
  const enterFlow = useCallback((trigger: string) => {
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

  // Exit flow state
  const exitFlow = useCallback((reason: string) => {
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

  // Rest to recover energy
  const rest = useCallback(async (duration: number): Promise<void> => {
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

  // Boost energy temporarily
  const boost = useCallback((amount: number, source: string) => {
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