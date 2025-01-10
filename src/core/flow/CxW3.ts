import { useState, useEffect, useCallback } from 'react';
import { useEnergy } from '../energy/useEnergy';
import { FlowState } from '../types/base';
import { EnergyType } from '../energy/types';

interface FlowMetrics {
  efficiency: number;
  duration: number;
  transitions: number;
  recoveryTime: number;
}

interface FlowConfig {
  minDuration: number;
  maxDuration: number;
  recoveryThreshold: number;
  transitionDelay: number;
}

const DEFAULT_CONFIG: FlowConfig = {
  minDuration: 25 * 60, // 25 minutes minimum
  maxDuration: 120 * 60, // 2 hours maximum
  recoveryThreshold: 0.3, // 30% energy triggers recovery
  transitionDelay: 5 * 60 // 5 minutes between transitions
};

export const useFlow = (config: Partial<FlowConfig> = {}) => {
  const {
    minDuration,
    maxDuration,
    recoveryThreshold,
    transitionDelay
  } = { ...DEFAULT_CONFIG, ...config };

  const { energy, consume, startRecovery, metrics: energyMetrics } = useEnergy();
  const [currentState, setCurrentState] = useState<FlowState>(FlowState.FOCUS);
  const [lastTransition, setLastTransition] = useState<Date>(new Date());
  const [metrics, setMetrics] = useState<FlowMetrics>({
    efficiency: 0.8,
    duration: 0,
    transitions: 0,
    recoveryTime: 0
  });

  const canTransition = useCallback((targetState: FlowState): boolean => {
    const timeSinceLastTransition = (new Date().getTime() - lastTransition.getTime()) / 1000;
    
    if (timeSinceLastTransition < transitionDelay) {
      return false;
    }

    if (currentState === FlowState.RECOVERING) {
      return false;
    }

    if (targetState === FlowState.HYPERFOCUS) {
      return energy.mental > 0.7 && energy.physical > 0.5 && energy.emotional > 0.6;
    }

    if (targetState === FlowState.FLOW) {
      return energy.mental > 0.5 && !isEnergyLow();
    }

    return true;
  }, [energy, lastTransition, transitionDelay, currentState]);

  const transitionTo = useCallback((newState: FlowState) => {
    if (!canTransition(newState)) {
      return false;
    }

    // Apply energy costs for transition
    if (newState === FlowState.HYPERFOCUS) {
      consume(EnergyType.Mental, 0.3);
      consume(EnergyType.Physical, 0.2);
      consume(EnergyType.Emotional, 0.2);
    }

    setCurrentState(newState);
    setLastTransition(new Date());
    setMetrics(prev => ({
      ...prev,
      transitions: prev.transitions + 1
    }));

    return true;
  }, [canTransition, consume]);

  const isEnergyLow = useCallback((): boolean => {
    return (
      energy.mental < recoveryThreshold ||
      energy.physical < recoveryThreshold ||
      energy.emotional < recoveryThreshold
    );
  }, [energy, recoveryThreshold]);

  const enforceRecovery = useCallback(() => {
    if (isEnergyLow()) {
      transitionTo(FlowState.RECOVERING);
      startRecovery();
    }
  }, [isEnergyLow, transitionTo, startRecovery]);

  const optimize = useCallback((targetState: FlowState) => {
    if (!canTransition(targetState)) {
      return false;
    }

    const currentEfficiency = energyMetrics.efficiency;
    const isOptimal = currentEfficiency > 0.7;

    if (isOptimal && targetState === FlowState.HYPERFOCUS) {
      return transitionTo(FlowState.HYPERFOCUS);
    }

    if (currentEfficiency > 0.5 && targetState === FlowState.FLOW) {
      return transitionTo(FlowState.FLOW);
    }

    return false;
  }, [canTransition, transitionTo, energyMetrics]);

  // Monitor state duration and enforce limits
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics(prev => {
        const newDuration = prev.duration + 1;
        
        // Enforce duration limits
        if (currentState === FlowState.HYPERFOCUS && newDuration > maxDuration) {
          enforceRecovery();
        }

        return {
          ...prev,
          duration: newDuration,
          efficiency: energyMetrics.efficiency
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentState, maxDuration, enforceRecovery, energyMetrics]);

  // Auto-transition to exhausted if energy critically low
  useEffect(() => {
    if (energy.mental < 0.1 || energy.physical < 0.1 || energy.emotional < 0.1) {
      transitionTo(FlowState.EXHAUSTED);
    }
  }, [energy, transitionTo]);

  return {
    currentState,
    metrics,
    canTransition,
    transitionTo,
    optimize,
    enforceRecovery,
    isEnergyLow
  };
}; 