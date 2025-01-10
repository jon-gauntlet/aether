import { useState, useEffect } from 'react';
import { useEnergySystem } from '../context/EnergySystemContext';
import { FlowState, FlowMetrics } from '../types/base';

export const useFlowState = () => {
  const energySystem = useEnergySystem();
  const [currentFlow, setCurrentFlow] = useState<FlowState | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [isProtected, setIsProtected] = useState(false);
  const [autoProtectEnabled, setAutoProtectEnabled] = useState(false);

  useEffect(() => {
    const flowSubscription = energySystem.state$.subscribe(
      (state: FlowState) => setCurrentFlow(state)
    );

    const levelSubscription = energySystem.metrics$.subscribe(
      (metrics: FlowMetrics) => setCurrentLevel(metrics.intensity)
    );

    return () => {
      flowSubscription.unsubscribe();
      levelSubscription.unsubscribe();
    };
  }, [energySystem]);

  useEffect(() => {
    if (autoProtectEnabled && !isProtected && currentLevel >= 0.8 && currentFlow?.type === 'natural') {
      protectFlow();
    }
  }, [currentLevel, currentFlow, isProtected, autoProtectEnabled]);

  const updateFlow = (state: Partial<FlowState>) => {
    if (!currentFlow) return;
    const updatedFlow = { ...currentFlow, ...state };
    energySystem.state$.next(updatedFlow);
  };

  const updateLevel = (level: number) => {
    if (level < 0 || level > 1) return;
    energySystem.metrics$.next({ ...energySystem.metrics$.value, intensity: level });
  };

  const protectFlow = () => {
    if (!currentFlow) return;
    const protectedFlow = {
      ...currentFlow,
      protection: {
        ...currentFlow.protection,
        level: currentFlow.protection.level + 1,
        type: 'enhanced' as const
      }
    };
    setIsProtected(true);
    energySystem.state$.next(protectedFlow);
  };

  const releaseFlow = () => {
    if (!currentFlow) return;
    const releasedFlow = {
      ...currentFlow,
      protection: {
        ...currentFlow.protection,
        level: Math.max(0, currentFlow.protection.level - 1),
        type: 'natural' as const
      }
    };
    setIsProtected(false);
    energySystem.state$.next(releasedFlow);
  };

  const toggleAutoProtect = () => {
    setAutoProtectEnabled(!autoProtectEnabled);
  };

  return {
    currentFlow,
    currentLevel,
    isProtected,
    autoProtectEnabled,
    updateFlow,
    updateLevel,
    protectFlow,
    releaseFlow,
    toggleAutoProtect
  };
}; 