import { useEffect, useState } from 'react';
import { useEnergySystem } from './useEnergySystem';
import { FlowState, FlowLevel } from '../types/flow';

interface FlowStateHook {
  currentFlow: FlowState;
  flowLevel: FlowLevel;
  isProtected: boolean;
  setFlow: (state: FlowState) => void;
  setFlowLevel: (level: FlowLevel) => void;
  protectFlow: () => void;
  releaseFlow: () => void;
}

export function useFlowState(): FlowStateHook {
  const energySystem = useEnergySystem();
  const [currentFlow, setCurrentFlow] = useState<FlowState>('rest');
  const [flowLevel, setCurrentLevel] = useState<FlowLevel>('medium');
  const [isProtected, setIsProtected] = useState(false);

  useEffect(() => {
    const flowSubscription = energySystem.getFlowState().subscribe(
      (state) => setCurrentFlow(state)
    );

    const levelSubscription = energySystem.getFlowLevel().subscribe(
      (level) => setCurrentLevel(level)
    );

    return () => {
      flowSubscription.unsubscribe();
      levelSubscription.unsubscribe();
    };
  }, [energySystem]);

  const setFlow = (state: FlowState) => {
    if (!isProtected) {
      energySystem.setFlowState(state);
    }
  };

  const setFlowLevel = (level: FlowLevel) => {
    if (!isProtected) {
      energySystem.setFlowLevel(level);
    }
  };

  const protectFlow = () => {
    if (flowLevel === 'high') {
      energySystem.protectFlow();
      setIsProtected(true);
    }
  };

  const releaseFlow = () => {
    energySystem.releaseFlow();
    setIsProtected(false);
  };

  return {
    currentFlow,
    flowLevel,
    isProtected,
    setFlow,
    setFlowLevel,
    protectFlow,
    releaseFlow
  };
