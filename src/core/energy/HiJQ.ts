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

  const updateEnergy = useCallback((amount: number, source: string = 'manual', notes: string = '') => {
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

  const setFlowState = useCallback((state: FlowState, notes: string = '') => {
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

  useEffect(() => {
    const timer = setInterval(() => {
      setEnergy(prev => {
        let decayRate = ENERGY_DECAY_RATE;
        let bonus = 1;

        if (prev.flow === FlowState.Flow) {
          bonus = FLOW_BONUS_MULTIPLIER;
        } else if (prev.flow === FlowState.Recovering) {
          decayRate = -RECOVERY_RATE; // Negative decay = recovery
        }

        const newCurrent = Math.max(0, Math.min(prev.max, prev.current - (decayRate * bonus)));
        const newFlow = newCurrent <= 20 ? FlowState.Exhausted : prev.flow;

        return {
          ...prev,
          current: newCurrent,
          flow: newFlow,
          meta: {
            ...prev.meta,
            duration: prev.meta.duration + 1
          }
        };
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  return {
    energy,
    updateEnergy,
    setFlowState
  };
} 