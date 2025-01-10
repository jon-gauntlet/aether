import { useEffect, useState, useCallback } from 'react';
import { useEnergySystem } from '.';
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
  const [autoProtectEnabled, setAutoProtectEnabled] = useState(true);

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

  // Auto-protect when conditions are optimal
  useEffect(() => {
    if (autoProtectEnabled && !isProtected && flowLevel === 'high' && currentFlow === 'focus') {
      protectFlow();
    }
  }, [flowLevel, currentFlow, isProtected, autoProtectEnabled]);

  const setFlow = useCallback((state: FlowState) => {
    if (!isProtected) {
      energySystem.setFlowState(state);
    }
  }, [energySystem, isProtected]);

  const setFlowLevel = useCallback((level: FlowLevel) => {
    if (!isProtected) {
      energySystem.setFlowLevel(level);
    }
  }, [energySystem, isProtected]);

  const protectFlow = useCallback(() => {
    if (flowLevel === 'high') {
      energySystem.protectFlow();
      setIsProtected(true);
    }
  }, [energySystem, flowLevel]);

  const releaseFlow = useCallback(() => {
    energySystem.releaseFlow();
    setIsProtected(false);
  }, [energySystem]);

  return {
    currentFlow,
    flowLevel,
    isProtected,
    setFlow,
    setFlowLevel,
    protectFlow,
    releaseFlow
  };
} 