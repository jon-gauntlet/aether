import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNaturalSystem } from './useNaturalSystem';

interface UseNaturalFlow {
  isInFlow: boolean;
  flowIntensity: number;
  flowCoherence: number;
  flowResonance: number;
  isProtected: boolean;
  enterFlow: () => void;
  exitFlow: () => void;
  protectFlow: () => void;
}

export function useNaturalFlow(): UseNaturalFlow {
  const { systemState, protection } = useNaturalSystem();
  const [isInFlow, setIsInFlow] = useState(false);

  // Flow state metrics
  const flowIntensity = useMemo(
    () => systemState.flow.intensity,
    [systemState.flow.intensity]
  );

  const flowCoherence = useMemo(
    () => systemState.flow.coherence,
    [systemState.flow.coherence]
  );

  const flowResonance = useMemo(
    () => systemState.flow.resonance,
    [systemState.flow.resonance]
  );

  // Natural flow cycles
  useEffect(() => {
    const checkFlowState = () => {
      const inFlow = 
        flowIntensity >= 0.618033988749895 && // Golden ratio threshold
        flowCoherence >= 0.414213562373095 && // Silver ratio threshold
        flowResonance >= 0.302775637731995;   // Bronze ratio threshold
      
      setIsInFlow(inFlow);
    };

    // Check flow state on metrics change
    checkFlowState();

    // Natural flow check cycle
    const interval = setInterval(checkFlowState, 5000); // 5-second natural cycle
    return () => clearInterval(interval);
  }, [flowIntensity, flowCoherence, flowResonance]);

  // Flow state management
  const enterFlow = useCallback(() => {
    if (!isInFlow) {
      setIsInFlow(true);
      // Increase flow intensity naturally
      systemState.flow.intensity = Math.min(
        1,
        systemState.flow.intensity + 0.618033988749895
      );
    }
  }, [isInFlow, systemState.flow]);

  const exitFlow = useCallback(() => {
    if (isInFlow) {
      setIsInFlow(false);
      // Decrease flow intensity naturally
      systemState.flow.intensity = Math.max(
        0,
        systemState.flow.intensity - 0.414213562373095
      );
    }
  }, [isInFlow, systemState.flow]);

  const protectFlow = useCallback(() => {
    if (isInFlow) {
      // Protect current flow state
      systemState.flow.protection = Math.min(
        1,
        systemState.flow.protection + 0.302775637731995
      );
    }
  }, [isInFlow, systemState.flow]);

  return {
    isInFlow,
    flowIntensity,
    flowCoherence,
    flowResonance,
    isProtected: protection,
    enterFlow,
    exitFlow,
    protectFlow
  };
} 