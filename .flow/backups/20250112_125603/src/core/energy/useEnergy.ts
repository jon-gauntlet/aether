import { useState, useEffect, useCallback } from 'react';
import { FlowState } from '../types/base';

export enum EnergyType {
  MENTAL = 'MENTAL',
  PHYSICAL = 'PHYSICAL',
  EMOTIONAL = 'EMOTIONAL'
}

interface EnergyLevels {
  mental: number;
  physical: number;
  emotional: number;
}

interface EnergyMetrics {
  efficiency: number;
  sustainability: number;
  recovery: number;
}

interface EnergyPrediction {
  mental: number;
  physical: number;
  emotional: number;
  duration: number;
}

const getEnergyKey = (type: EnergyType): keyof EnergyLevels => {
  switch (type) {
    case EnergyType.MENTAL:
      return 'mental';
    case EnergyType.PHYSICAL:
      return 'physical';
    case EnergyType.EMOTIONAL:
      return 'emotional';
  }
};

export const useEnergy = () => {
  const [energy, setEnergy] = useState<EnergyLevels>({
    mental: 1.0,
    physical: 1.0,
    emotional: 1.0
  });

  const [currentState, setCurrentState] = useState(FlowState.FOCUS);
  const [isRecovering, setIsRecovering] = useState(false);
  const [flowEfficiency, setFlowEfficiency] = useState(0.8);
  const [metrics, setMetrics] = useState<EnergyMetrics>({
    efficiency: 0.8,
    sustainability: 0.9,
    recovery: 0.7
  });

  const consume = useCallback((type: EnergyType, amount: number) => {
    const key = getEnergyKey(type);
    setEnergy(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] - amount)
    }));
    updateMetrics();
  }, []);

  const startRecovery = useCallback(() => {
    setIsRecovering(true);
    setCurrentState(FlowState.RECOVERING);
  }, []);

  const optimize = useCallback((targetState: FlowState) => {
    const efficiency = calculateEfficiency();
    setFlowEfficiency(efficiency);
    
    if (targetState === FlowState.FLOW) {
      setEnergy(prev => ({
        ...prev,
        mental: Math.min(1.0, prev.mental + 0.2)
      }));
    }
  }, []);

  const calculateEfficiency = useCallback(() => {
    const { mental, physical, emotional } = energy;
    return (mental + physical + emotional) / 3;
  }, [energy]);

  const updateMetrics = useCallback(() => {
    const efficiency = calculateEfficiency();
    const sustainability = Math.min(energy.mental, energy.physical, energy.emotional);
    const recovery = isRecovering ? 0.8 : 0.4;

    setMetrics({
      efficiency,
      sustainability,
      recovery
    });
  }, [energy, isRecovering, calculateEfficiency]);

  const transitionTo = useCallback((newState: FlowState) => {
    if (newState === FlowState.HYPERFOCUS) {
      consume(EnergyType.MENTAL, 0.3);
    }
    setCurrentState(newState);
  }, [consume]);

  const enforceRecovery = useCallback(() => {
    if (calculateEfficiency() < 0.3) {
      startRecovery();
    }
  }, [calculateEfficiency]);

  const predictEnergyNeeds = useCallback((targetState: FlowState): EnergyPrediction => {
    const baseCost = {
      [FlowState.FOCUS]: 0.2,
      [FlowState.FLOW]: 0.4,
      [FlowState.HYPERFOCUS]: 0.6,
      [FlowState.RECOVERING]: 0,
      [FlowState.EXHAUSTED]: 0,
      [FlowState.DISTRACTED]: 0.1
    };

    return {
      mental: baseCost[targetState] * 1.2,
      physical: baseCost[targetState],
      emotional: baseCost[targetState] * 0.8,
      duration: targetState === FlowState.HYPERFOCUS ? 3600 : 7200
    };
  }, []);

  useEffect(() => {
    const recoveryInterval = setInterval(() => {
      if (isRecovering) {
        setEnergy(prev => ({
          mental: Math.min(1.0, prev.mental + 0.1),
          physical: Math.min(1.0, prev.physical + 0.1),
          emotional: Math.min(1.0, prev.emotional + 0.1)
        }));
        updateMetrics();
      }
    }, 5000);

    return () => clearInterval(recoveryInterval);
  }, [isRecovering]);

  const isDepletionWarning = energy.mental < 0.2 || energy.physical < 0.2 || energy.emotional < 0.2;

  return {
    energy,
    currentState,
    isRecovering,
    isDepletionWarning,
    flowEfficiency,
    metrics,
    consume,
    startRecovery,
    optimize,
    calculateEfficiency,
    transitionTo,
    enforceRecovery,
    predictEnergyNeeds
  };
}; 